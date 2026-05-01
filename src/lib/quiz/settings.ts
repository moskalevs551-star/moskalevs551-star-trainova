import type { QuizDocument, TestSettings } from "./types";

export const DEFAULT_SETTINGS: TestSettings = {
  general: {
    title: "Новый тест",
    description: "Интерактивный тренажёр из вашего файла",
    category: "Обучение",
    language: "ru",
    tags: ["тест", "подготовка", "тренировка"],
  },
  questions: {
    questionCount: "20",
    customQuestionCount: 20,
    rangeFrom: 1,
    rangeTo: 20,
    questionSelection: "random",
    questionOrder: "random",
  },
  answers: {
    answerOrder: "safe_random",
    protectSpecialAnswers: true,
  },
  mode: {
    type: "training",
    showHints: true,
    allowSkip: true,
  },
  timer: {
    enabled: false,
    type: "whole_test",
    minutes: null,
    secondsPerQuestion: null,
    onExpire: "submit_test",
  },
  attempts: {
    limitEnabled: false,
    maxAttempts: null,
    saveBestResult: true,
    saveLastResult: true,
    saveAttemptHistory: true,
  },
  review: {
    showCorrectAnswer: "after_each_question",
    showExplanation: "after_wrong_answer",
    showScore: true,
    showPercentage: true,
    showWrongAnswers: true,
    allowRetryWrongAnswers: true,
  },
  progress: {
    saveProgress: true,
    saveWrongAnswers: true,
    saveLastPosition: true,
    saveTimeSpent: true,
    saveWeakTopics: true,
    allowResume: true,
  },
  access: {
    visibility: "private",
    shareByLink: false,
    passwordEnabled: false,
    allowCopy: false,
    allowDownload: false,
  },
  appearance: {
    theme: "green",
    layout: "one_question_per_screen",
    animations: "enabled",
  },
  import: {
    sourceFormat: "qst",
    encodingFallbacks: ["utf-8", "windows-1251"],
    detectMissingNumbers: true,
    ignoreEmptyLines: true,
    ignoreExecutableFilesInZip: true,
    validateBeforeStart: true,
  },
};

export function settingsForQuiz(quiz?: QuizDocument | null): TestSettings {
  if (!quiz) {
    return DEFAULT_SETTINGS;
  }

  return {
    ...DEFAULT_SETTINGS,
    general: {
      ...DEFAULT_SETTINGS.general,
      title: quiz.title,
      description: `Тренажёр из файла ${quiz.sourceFileName ?? quiz.title}`,
    },
    import: {
      ...DEFAULT_SETTINGS.import,
      sourceFormat: quiz.sourceFormat,
    },
  };
}

export function questionLimit(settings: TestSettings, total: number) {
  if (settings.questions.questionCount === "all") {
    return total;
  }

  if (settings.questions.questionCount === "range") {
    return total;
  }

  if (settings.questions.questionCount === "custom") {
    return Math.min(Math.max(settings.questions.customQuestionCount, 1), total);
  }

  return Math.min(Number(settings.questions.questionCount), total);
}
