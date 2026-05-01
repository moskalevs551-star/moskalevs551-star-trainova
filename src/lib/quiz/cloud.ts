import type { QuizDocument, TestAttempt, TestSettings, UserProgress } from "./types";

export type CloudTestSummary = {
  id: string;
  title: string;
  sourceFormat: string;
  questionCount: number;
  updatedAt: string;
  createdAt?: string;
  progressPercent: number;
  bestScorePercent: number;
  attemptCount?: number;
  wrongCount?: number;
  lastAttemptAt?: string | null;
  lastAttemptScore?: number | null;
};

export type CloudTestDetail = {
  quiz: QuizDocument;
  settings: TestSettings;
  progress: {
    last_question_id?: string | null;
    progress_percent?: number | null;
    best_score_percent?: number | null;
    wrong_question_ids?: string[] | null;
    favorite_question_ids?: string[] | null;
    difficult_question_ids?: string[] | null;
    time_spent_seconds?: number | null;
    updated_at?: string | null;
  } | null;
  attempts: {
    id: string;
    score_percent: number;
    correct_count: number;
    wrong_count: number;
    skipped_count: number;
    time_spent_seconds: number;
    created_at: string;
  }[];
  wrongQuestionCount: number;
};

export async function fetchCloudTests() {
  const response = await fetch("/api/tests", { cache: "no-store" });

  if (response.status === 401 || response.status === 503) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Не получилось загрузить тесты из аккаунта.");
  }

  const payload = (await response.json()) as { tests: CloudTestSummary[] };
  return payload.tests;
}

export async function fetchCloudTest(id: string) {
  const response = await fetch(`/api/tests/${id}`, { cache: "no-store" });

  if (response.status === 401 || response.status === 404 || response.status === 503) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Не получилось загрузить тренажёр из аккаунта.");
  }

  return (await response.json()) as CloudTestDetail;
}

export async function saveLocalQuizToAccount(payload: {
  quiz: QuizDocument;
  settings: TestSettings;
  progress?: UserProgress | null;
}) {
  const response = await fetch("/api/tests", {
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Не получилось сохранить тест в аккаунт.");
  }

  return (await response.json()) as { id: string };
}

export async function saveAttemptToAccount(payload: {
  quiz: QuizDocument;
  attempt: TestAttempt;
}) {
  if (!payload.quiz.cloudId || payload.quiz.isDemo) {
    return null;
  }

  const response = await fetch("/api/attempts", {
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as { id: string };
}

export async function saveProgressStepToAccount(payload: {
  quiz: QuizDocument;
  answers: TestAttempt["answers"];
  currentQuestionId?: string;
}) {
  if (!payload.quiz.cloudId || payload.quiz.isDemo) {
    return null;
  }

  const response = await fetch("/api/progress", {
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as { ok: true };
}
