import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AttemptAnswer, QuizDocument } from "@/lib/quiz/types";

type ProgressPayload = {
  quiz: QuizDocument;
  answers: AttemptAnswer[];
  currentQuestionId?: string;
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

  const { quiz, answers, currentQuestionId } = (await request.json()) as ProgressPayload;
  const testId = quiz.cloudId;

  if (!testId) {
    return NextResponse.json({ error: "Test is not saved in Supabase" }, { status: 400 });
  }

  const { data: dbQuestions } = await supabase
    .from("questions")
    .select("id,number")
    .eq("test_id", testId);

  const localQuestionById = new Map(quiz.questions.map((question) => [question.id, question]));
  const dbQuestionByNumber = new Map((dbQuestions ?? []).map((question) => [question.number, question.id]));
  const lastLocalQuestion = currentQuestionId ? localQuestionById.get(currentQuestionId) : null;
  const wrongQuestionIds = answers.flatMap((answer) => {
    if (answer.correct) {
      return [];
    }

    const localQuestion = localQuestionById.get(answer.questionId);
    const dbQuestionId = localQuestion ? dbQuestionByNumber.get(localQuestion.number) : null;
    return dbQuestionId ? [dbQuestionId] : [];
  });

  await supabase.from("user_progress").upsert(
    {
      last_question_id: lastLocalQuestion ? dbQuestionByNumber.get(lastLocalQuestion.number) ?? null : null,
      progress_percent: Math.min(100, Math.round((answers.length / quiz.questions.length) * 100)),
      test_id: testId,
      updated_at: new Date().toISOString(),
      user_id: user.id,
      wrong_question_ids: Array.from(new Set(wrongQuestionIds)),
    },
    { onConflict: "user_id,test_id" }
  );

  return NextResponse.json({ ok: true });
}
