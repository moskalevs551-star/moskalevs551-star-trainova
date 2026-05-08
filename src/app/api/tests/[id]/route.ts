import { NextResponse } from "next/server";

import { settingsForQuiz } from "@/lib/quiz/settings";
import type {
  QuizAnswer,
  QuizDocument,
  QuizQuestion,
  QuizValidation,
  SourceFormat,
  TestSettings,
} from "@/lib/quiz/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

type DbAnswer = {
  id: string;
  question_id: string;
  text: string;
  correct: boolean;
  position: number;
};

type DbQuestion = {
  id: string;
  number: number;
  text: string;
  status: QuizQuestion["status"];
  flagged: boolean | null;
  favorite: boolean | null;
  difficult: boolean | null;
  explanation: string | null;
  source_line: number | null;
};

function buildValidation(questions: QuizQuestion[]): QuizValidation {
  const numbers = questions.map((question) => question.number).sort((a, b) => a - b);
  const existingNumbers = new Set(numbers);
  const maxNumber = numbers.at(-1) ?? 0;
  const missingNumbers = [];

  for (let number = 1; number <= maxNumber; number += 1) {
    if (!existingNumbers.has(number)) {
      missingNumbers.push(number);
    }
  }

  return {
    formatIssues: [],
    missingNumbers,
    questionsWithDuplicateAnswers: questions
      .filter((question) => {
        const normalized = question.answers.map((answer) => answer.text.trim().toLowerCase()).filter(Boolean);
        return new Set(normalized).size !== normalized.length;
      })
      .map((question) => question.number),
    questionsWithMultipleCorrectAnswers: questions
      .filter((question) => question.answers.filter((answer) => answer.correct).length > 1)
      .map((question) => question.number),
    questionsWithTooFewAnswers: questions
      .filter((question) => question.answers.length < 2)
      .map((question) => question.number),
    questionsWithoutCorrectAnswer: questions
      .filter((question) => !question.answers.some((answer) => answer.correct))
      .map((question) => question.number),
    totalAnswers: questions.reduce((sum, question) => sum + question.answers.length, 0),
    totalCorrectAnswers: questions.reduce(
      (sum, question) => sum + question.answers.filter((answer) => answer.correct).length,
      0
    ),
    totalQuestions: questions.length,
  };
}

export async function GET(_request: Request, { params }: Params) {
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

  const { id } = await params;
  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("id,title,source_format,source_file_name,source_encoding,question_count,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (testError) {
    return NextResponse.json({ error: testError.message }, { status: 400 });
  }

  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const [
    { data: dbQuestions, error: questionsError },
    { data: dbAnswers, error: answersError },
    { data: settingsRow },
    { data: progress },
    { data: attempts },
    { data: wrongQuestions },
    { data: favoriteQuestions },
  ] = await Promise.all([
    supabase
      .from("questions")
      .select("id,number,text,status,flagged,favorite,difficult,explanation,source_line")
      .eq("test_id", id)
      .order("number", { ascending: true }),
    supabase
      .from("answers")
      .select("id,question_id,text,correct,position")
      .eq("test_id", id)
      .order("position", { ascending: true }),
    supabase.from("test_settings").select("settings").eq("test_id", id).maybeSingle(),
    supabase
      .from("user_progress")
      .select("last_question_id,progress_percent,best_score_percent,wrong_question_ids,favorite_question_ids,difficult_question_ids,time_spent_seconds,updated_at")
      .eq("test_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("attempts")
      .select("id,score_percent,correct_count,wrong_count,skipped_count,time_spent_seconds,created_at")
      .eq("test_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("wrong_questions").select("question_id,wrong_count,last_wrong_at").eq("test_id", id).eq("user_id", user.id),
    supabase.from("favorite_questions").select("question_id").eq("test_id", id).eq("user_id", user.id),
  ]);

  if (questionsError || answersError) {
    return NextResponse.json(
      { error: questionsError?.message ?? answersError?.message ?? "Could not load test" },
      { status: 400 }
    );
  }

  const answersByQuestion = new Map<string, QuizAnswer[]>();
  (dbAnswers as DbAnswer[] | null | undefined)?.forEach((answer) => {
    const answers = answersByQuestion.get(answer.question_id) ?? [];
    answers.push({
      correct: answer.correct,
      id: answer.id,
      text: answer.text,
    });
    answersByQuestion.set(answer.question_id, answers);
  });

  const favoriteIds = new Set((favoriteQuestions ?? []).map((question) => question.question_id));
  const questions: QuizQuestion[] = ((dbQuestions as DbQuestion[] | null | undefined) ?? []).map((question) => ({
    answers: answersByQuestion.get(question.id) ?? [],
    difficult: Boolean(question.difficult),
    explanation: question.explanation ?? undefined,
    favorite: Boolean(question.favorite) || favoriteIds.has(question.id),
    flagged: Boolean(question.flagged),
    id: question.id,
    number: question.number,
    sourceLine: question.source_line ?? undefined,
    status: question.status,
    text: question.text,
  }));

  const quiz: QuizDocument = {
    cloudId: test.id,
    createdAt: test.created_at,
    encoding: test.source_encoding ?? undefined,
    id: test.id,
    isDemo: false,
    questions,
    sourceFileName: test.source_file_name ?? undefined,
    sourceFormat: (test.source_format ?? "qst") as SourceFormat,
    title: test.title,
    updatedAt: test.updated_at ?? test.created_at,
    validation: buildValidation(questions),
  };

  return NextResponse.json({
    attempts: attempts ?? [],
    progress: progress ?? null,
    quiz,
    settings: ((settingsRow?.settings as TestSettings | undefined) ?? settingsForQuiz(quiz)) as TestSettings,
    wrongQuestionCount: wrongQuestions?.length ?? 0,
  });
}
