import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QuizDocument, TestSettings, UserProgress } from "@/lib/quiz/types";

type SaveTestPayload = {
  quiz: QuizDocument;
  settings: TestSettings;
  progress?: UserProgress | null;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tests, error } = await supabase
    .from("tests")
    .select("id,title,source_format,question_count,updated_at,created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const testIds = (tests ?? []).map((test) => test.id);
  const [{ data: progress }, { data: attempts }, { data: wrongQuestions }] = await Promise.all([
    testIds.length
      ? supabase
          .from("user_progress")
          .select("test_id,progress_percent,best_score_percent,updated_at,wrong_question_ids")
          .in("test_id", testIds)
      : Promise.resolve({ data: [] }),
    testIds.length
      ? supabase
          .from("attempts")
          .select("test_id,score_percent,created_at")
          .in("test_id", testIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    testIds.length
      ? supabase.from("wrong_questions").select("test_id").in("test_id", testIds)
      : Promise.resolve({ data: [] }),
  ]);

  return NextResponse.json({
    tests: (tests ?? []).map((test) => {
      const testProgress = progress?.find((item) => item.test_id === test.id);
      const lastAttempt = attempts?.find((item) => item.test_id === test.id);
      const attemptCount = attempts?.filter((item) => item.test_id === test.id).length ?? 0;
      const wrongFromProgress = Array.isArray(testProgress?.wrong_question_ids)
        ? testProgress.wrong_question_ids.length
        : 0;
      const wrongRows = wrongQuestions?.filter((item) => item.test_id === test.id).length ?? 0;
      const wrongCount = wrongRows || wrongFromProgress;

      return {
        attemptCount,
        bestScorePercent: Number(testProgress?.best_score_percent ?? lastAttempt?.score_percent ?? 0),
        createdAt: test.created_at,
        id: test.id,
        lastAttemptAt: lastAttempt?.created_at ?? null,
        lastAttemptScore: lastAttempt?.score_percent ? Number(lastAttempt.score_percent) : null,
        progressPercent: Number(testProgress?.progress_percent ?? 0),
        questionCount: test.question_count ?? 0,
        sourceFormat: test.source_format,
        title: test.title,
        updatedAt: test.updated_at ?? test.created_at,
        wrongCount,
      };
    }),
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as SaveTestPayload;
  const { quiz, settings, progress } = payload;

  if (!quiz?.questions?.length) {
    return NextResponse.json({ error: "Quiz is empty" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: test, error: testError } = await supabase
    .from("tests")
    .insert({
      language: settings.general.language,
      question_count: quiz.questions.length,
      source_encoding: quiz.encoding,
      source_file_name: quiz.sourceFileName,
      source_format: quiz.sourceFormat,
      title: settings.general.title || quiz.title,
      updated_at: now,
      user_id: user.id,
      visibility: settings.access.visibility,
    })
    .select("id")
    .single();

  if (testError || !test) {
    return NextResponse.json({ error: testError?.message ?? "Could not create test" }, { status: 400 });
  }

  const { data: savedQuestions, error: questionsError } = await supabase
    .from("questions")
    .insert(
      quiz.questions.map((question) => ({
        difficult: Boolean(question.difficult),
        explanation: question.explanation ?? null,
        favorite: Boolean(question.favorite),
        flagged: Boolean(question.flagged),
        number: question.number,
        status: question.status,
        test_id: test.id,
        text: question.text,
      }))
    )
    .select("id,number");

  if (questionsError || !savedQuestions) {
    return NextResponse.json({ error: questionsError?.message ?? "Could not save questions" }, { status: 400 });
  }

  const questionIdByNumber = new Map(savedQuestions.map((question) => [question.number, question.id]));
  const answers = quiz.questions.flatMap((question) =>
    question.answers.map((answer, index) => ({
      correct: answer.correct,
      position: index,
      question_id: questionIdByNumber.get(question.number),
      test_id: test.id,
      text: answer.text,
    }))
  );

  const { error: answersError } = await supabase.from("answers").insert(answers);

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 400 });
  }

  await supabase.from("test_settings").insert({
    settings,
    test_id: test.id,
  });

  if (progress) {
    await supabase.from("user_progress").upsert(
      {
        best_score_percent: progress.bestScore,
        difficult_question_ids: progress.difficultQuestionIds,
        favorite_question_ids: progress.favoriteQuestionIds,
        progress_percent: Math.min(100, Math.round((progress.solvedToday / quiz.questions.length) * 100)),
        test_id: test.id,
        time_spent_seconds: progress.attempts.reduce((sum, attempt) => sum + attempt.timeSpentSeconds, 0),
        updated_at: now,
        user_id: user.id,
        wrong_question_ids: progress.wrongQuestionIds,
      },
      { onConflict: "user_id,test_id" }
    );
  }

  const favoriteLocalIds = new Set([
    ...quiz.questions.filter((question) => question.favorite).map((question) => question.id),
    ...(progress?.favoriteQuestionIds ?? []),
  ]);
  const favoriteRows = quiz.questions
    .filter((question) => favoriteLocalIds.has(question.id))
    .flatMap((question) => {
      const dbQuestionId = questionIdByNumber.get(question.number);
      return dbQuestionId
        ? [
            {
              question_id: dbQuestionId,
              test_id: test.id,
              user_id: user.id,
            },
          ]
        : [];
    });

  if (favoriteRows.length) {
    await supabase.from("favorite_questions").upsert(favoriteRows, {
      onConflict: "test_id,user_id,question_id",
    });
  }

  return NextResponse.json({ id: test.id });
}
