import type { QuizDocument, TestAttempt, TestSettings, UserProgress } from "./types";
import { DEFAULT_SETTINGS, settingsForQuiz } from "./settings";

const QUIZ_KEY = "trainova.currentQuiz";
const SETTINGS_KEY = "trainova.settings";
const ATTEMPT_KEY = "trainova.activeAttempt";
const PROGRESS_KEY = "trainova.progress";
const LEGACY_KEYS = [
  "testflow.currentQuiz",
  "testflow.settings",
  "testflow.activeAttempt",
  "testflow.progress",
];

export function loadQuiz(): QuizDocument | null {
  return readJson<QuizDocument>(QUIZ_KEY);
}

export function saveQuiz(quiz: QuizDocument) {
  writeJson(QUIZ_KEY, { ...quiz, updatedAt: new Date().toISOString() });
}

export function loadSettings(quiz?: QuizDocument | null): TestSettings {
  const stored = readJson<Partial<TestSettings>>(SETTINGS_KEY);
  const defaults = settingsForQuiz(quiz);

  if (!stored) {
    return defaults;
  }

  return {
    ...defaults,
    ...stored,
    general: { ...defaults.general, ...stored.general },
    questions: { ...defaults.questions, ...stored.questions },
    answers: { ...defaults.answers, ...stored.answers },
    mode: { ...defaults.mode, ...stored.mode },
    timer: { ...defaults.timer, ...stored.timer },
    attempts: { ...defaults.attempts, ...stored.attempts },
    review: { ...defaults.review, ...stored.review },
    progress: { ...defaults.progress, ...stored.progress },
    access: { ...defaults.access, ...stored.access },
    appearance: { ...defaults.appearance, ...stored.appearance },
    import: { ...defaults.import, ...stored.import },
  };
}

export function saveSettings(settings: TestSettings) {
  writeJson(SETTINGS_KEY, settings);
}

export function loadAttempt(): TestAttempt | null {
  return readJson<TestAttempt>(ATTEMPT_KEY);
}

export function saveAttempt(attempt: TestAttempt) {
  writeJson(ATTEMPT_KEY, attempt);
}

export function clearAttempt() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ATTEMPT_KEY);
  }
}

export function loadProgress(testId?: string): UserProgress | null {
  const progress = readJson<UserProgress>(PROGRESS_KEY);

  if (!progress || (testId && progress.testId !== testId)) {
    return null;
  }

  return progress;
}

export function saveProgress(progress: UserProgress) {
  writeJson(PROGRESS_KEY, progress);
}

export function ensureProgress(testId: string): UserProgress {
  return (
    loadProgress(testId) ?? {
      testId,
      solvedToday: 0,
      streak: 1,
      bestScore: 0,
      averageScore: 0,
      wrongQuestionIds: [],
      favoriteQuestionIds: [],
      difficultQuestionIds: [],
      attempts: [],
    }
  );
}

export function resetLocalState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(QUIZ_KEY);
  window.localStorage.removeItem(SETTINGS_KEY);
  window.localStorage.removeItem(ATTEMPT_KEY);
  window.localStorage.removeItem(PROGRESS_KEY);
  LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function cloneDefaultSettings() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as TestSettings;
}
