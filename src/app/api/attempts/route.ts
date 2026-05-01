import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QuizDocument, TestAttempt } from "@/lib/quiz/types";

type SaveAttemptPayload = {
  quiz: QuizDocument;
  attempt: TestAttempt;
};

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

  const { quiz, attempt } = (await request.json()) as SaveAttemptPayload;
  const testId = quiz.cloudId;

  if (!testId) {
    return NextResponse.json({ error: "Test is not saved in Supabase" }, { status: 400 });
  }

  const correctCount = attempt.answers.filter((answer) => answer.correct).length;
  const skippedCount = attempt.answers.filter((answer) => answer.skipped).length;
  const wrongCount = attempt.answers.length - correctCount;

  const { data: savedAttempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      correct_count: correctCount,
      score_percent: attempt.score,
      skipped_count: skippedCount,
      test_id: testId,
      time_spent_seconds: attempt.timeSpentSeconds,
      user_id: user.id,
      wrong_count: wrongCount,
    })
    .select("id")
    .single();

  if (attemptError || !savedAttempt) {
    return NextResponse.json({ error: attemptError?.message ?? "Could not save attempt" }, { status: 400 });
  }

  const [{ data: dbQuestions }, { data: dbAnswers }] = await Promise.all([
    supabase.from("questions").select("id,number").eq("test_id", testId),
    supabase.from("answers").select("id,question_id,text").eq("test_id", testId),
  ]);

  const localQuestionById = new Map(quiz.questions.map((question) => [question.id, question]));
  const dbQuestionByNumber = new Map((dbQuestions ?? []).map((question) => [question.number, question.id]));
  const answerRows = attempt.answers.flatMap((answer) => {
    const localQuestion = localQuestionById.get(answer.questionId);
    const dbQuestionId = localQuestion ? dbQuestionByNumber.get(localQuestion.number) : null;

    if (!localQuestion || !dbQuestionId) {
      return [];
    }

    const selectedText = localQuestion.answers.find((item) => item.id === answer.selectedAnswerId)?.text;
    const dbAnswerId = selectedText
      ? dbAnswers?.find((item) => item.question_id === dbQuestionId && item.text === selectedText)?.id
      : null;

    return [
      {
        answer_id: dbAnswerId ?? null,
        attempt_id: savedAttempt.id,
        is_correct: answer.correct,
        question_id: dbQuestionId,
        skipped: answer.skipped,
      },
    ];
  });

  if (answerRows.length) {
    await supabase.from("attempt_answers").insert(answerRows);
  }

  const wrongQuestionIds = answerRows
    .filter((row) => !row.is_correct)
    .map((row) => row.question_id);

  const { data: currentProgress } = await supabase
    .from("user_progress")
    .select("best_score_percent")
    .eq("user_id", user.id)
    .eq("test_id", testId)
    .maybeSingle();

  await supabase.from("user_progress").upsert(
    {
      best_score_percent: Math.max(Number(currentProgress?.best_score_percent ?? 0), attempt.score),
      last_question_id: answerRows.at(-1)?.question_id ?? null,
      progress_percent: Math.min(100, Math.round((attempt.answers.length / quiz.questions.length) * 100)),
      test_id: testId,
      time_spent_seconds: attempt.timeSpentSeconds,
      updated_at: new Date().toISOString(),
      user_id: user.id,
      wrong_question_ids: wrongQuestionIds,
    },
    { onConflict: "user_id,test_id" }
  );

  if (wrongQuestionIds.length) {
    await supabase.from("wrong_questions").upsert(
      wrongQuestionIds.map((questionId) => ({
        question_id: questionId,
        test_id: testId,
        user_id: user.id,
      })),
      { onConflict: "test_id,user_id,question_id" }
    );
  }

  return NextResponse.json({ id: savedAttempt.id });
}
