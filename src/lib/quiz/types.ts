export type SourceFormat = "qst" | "txt" | "zip" | "docx" | "xlsx";

export type QuestionStatus = "valid" | "needs_review" | "invalid";

export type QuizAnswer = {
  id: string;
  text: string;
  correct: boolean;
};

export type QuizQuestion = {
  id: string;
  number: number;
  text: string;
  answers: QuizAnswer[];
  status: QuestionStatus;
  flagged?: boolean;
  favorite?: boolean;
  difficult?: boolean;
  explanation?: string;
  sourceLine?: number;
};

export type QuizValidation = {
  totalQuestions: number;
  totalAnswers: number;
  totalCorrectAnswers: number;
  missingNumbers: number[];
  questionsWithoutCorrectAnswer: number[];
  questionsWithMultipleCorrectAnswers: number[];
  questionsWithTooFewAnswers: number[];
  questionsWithDuplicateAnswers: number[];
  formatIssues: string[];
};

export type QuizDocument = {
  id: string;
  cloudId?: string;
  isDemo?: boolean;
  title: string;
  sourceFormat: SourceFormat;
  sourceFileName?: string;
  encoding?: string;
  questions: QuizQuestion[];
  validation: QuizValidation;
  createdAt: string;
  updatedAt: string;
};

export type ImportCandidate = {
  id: string;
  name: string;
  extension: SourceFormat;
  size: number;
  bytes?: Uint8Array;
  text?: string;
  ignored?: boolean;
  reason?: string;
};

export type TestMode =
  | "training"
  | "exam"
  | "quick"
  | "mistakes"
  | "review"
  | "control"
  | "no_hints";

export type TestSettings = {
  general: {
    title: string;
    description: string;
    category: string;
    language: "ru" | "en" | "kk";
    tags: string[];
  };
  questions: {
    questionCount: "all" | "10" | "20" | "50" | "custom" | "range";
    customQuestionCount: number;
    rangeFrom: number;
    rangeTo: number;
    questionSelection:
      | "all"
      | "random"
      | "unseen"
      | "mistakes"
      | "favorites"
      | "difficult";
    questionOrder: "file" | "random" | "new_first" | "difficult_first" | "mistakes_first";
  };
  answers: {
    answerOrder: "file" | "random" | "safe_random";
    protectSpecialAnswers: boolean;
  };
  mode: {
    type: TestMode;
    showHints: boolean;
    allowSkip: boolean;
  };
  timer: {
    enabled: boolean;
    type: "whole_test" | "per_question";
    minutes: number | null;
    secondsPerQuestion: number | null;
    onExpire: "submit_test" | "next_question" | "finish_current";
  };
  attempts: {
    limitEnabled: boolean;
    maxAttempts: number | null;
    saveBestResult: boolean;
    saveLastResult: boolean;
    saveAttemptHistory: boolean;
  };
  review: {
    showCorrectAnswer: "immediately" | "after_each_question" | "end" | "never";
    showExplanation: "always" | "after_wrong_answer" | "never";
    showScore: boolean;
    showPercentage: boolean;
    showWrongAnswers: boolean;
    allowRetryWrongAnswers: boolean;
  };
  progress: {
    saveProgress: boolean;
    saveWrongAnswers: boolean;
    saveLastPosition: boolean;
    saveTimeSpent: boolean;
    saveWeakTopics: boolean;
    allowResume: boolean;
  };
  access: {
    visibility: "private" | "link" | "public" | "password";
    shareByLink: boolean;
    passwordEnabled: boolean;
    allowCopy: boolean;
    allowDownload: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "green" | "minimal";
    layout: "one_question_per_screen" | "multiple_questions" | "compact" | "cards";
    animations: "enabled" | "reduced" | "off";
  };
  import: {
    sourceFormat: SourceFormat;
    encodingFallbacks: string[];
    detectMissingNumbers: boolean;
    ignoreEmptyLines: boolean;
    ignoreExecutableFilesInZip: boolean;
    validateBeforeStart: boolean;
  };
};

export type AttemptAnswer = {
  questionId: string;
  selectedAnswerId?: string;
  correct: boolean;
  skipped: boolean;
  answeredAt: string;
};

export type TestAttempt = {
  id: string;
  testId: string;
  startedAt: string;
  finishedAt?: string;
  currentIndex: number;
  answers: AttemptAnswer[];
  score: number;
  timeSpentSeconds: number;
  completed: boolean;
};

export type UserProgress = {
  testId: string;
  lastQuestionId?: string;
  solvedToday: number;
  streak: number;
  bestScore: number;
  averageScore: number;
  wrongQuestionIds: string[];
  favoriteQuestionIds: string[];
  difficultQuestionIds: string[];
  attempts: TestAttempt[];
};
