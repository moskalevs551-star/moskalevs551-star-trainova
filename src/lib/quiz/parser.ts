import JSZip from "jszip";
import type {
  ImportCandidate,
  QuizAnswer,
  QuizDocument,
  QuizQuestion,
  QuizValidation,
  SourceFormat,
} from "./types";
import { quizDocumentSchema } from "./schemas";

const SUPPORTED_TEXT_EXTENSIONS = new Set(["qst", "txt"]);
const SUPPORTED_ARCHIVE_EXTENSIONS = new Set(["zip"]);
const DISCOVERABLE_EXTENSIONS = new Set(["qst", "txt", "docx", "xlsx"]);
const DANGEROUS_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "scr",
  "msi",
  "ps1",
  "vbs",
  "js",
]);

type DecodedText = {
  text: string;
  encoding: string;
};

export async function extractImportCandidates(file: File): Promise<ImportCandidate[]> {
  const extension = extensionOf(file.name);

  if (SUPPORTED_ARCHIVE_EXTENSIONS.has(extension)) {
    return extractZipCandidates(file);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!DISCOVERABLE_EXTENSIONS.has(extension)) {
    return [
      {
        id: crypto.randomUUID(),
        name: file.name,
        extension: "txt",
        size: file.size,
        ignored: true,
        reason: "Поддерживаются только QST, TXT и ZIP.",
      },
    ];
  }

  return [
    {
      id: crypto.randomUUID(),
      name: file.name,
      extension: extension as SourceFormat,
      size: file.size,
      bytes,
      ignored: !SUPPORTED_TEXT_EXTENSIONS.has(extension),
      reason: SUPPORTED_TEXT_EXTENSIONS.has(extension)
        ? undefined
        : "Файл найден, но MVP сейчас распознаёт только QST/TXT.",
    },
  ];
}

export async function parseImportCandidate(candidate: ImportCandidate): Promise<QuizDocument> {
  if (candidate.ignored) {
    throw new Error(candidate.reason ?? "Этот файл нельзя распознать.");
  }

  const decoded =
    candidate.text != null ? { text: candidate.text, encoding: "utf-8" } : decodeBytes(candidate.bytes);

  return parseQstText(decoded.text, {
    title: cleanTitle(candidate.name),
    fileName: candidate.name,
    format: candidate.extension,
    encoding: decoded.encoding,
  });
}

export function parseQstText(
  text: string,
  options: {
    title?: string;
    fileName?: string;
    format?: SourceFormat;
    encoding?: string;
  } = {}
): QuizDocument {
  const blocks = splitIntoQuestionBlocks(text);
  const formatIssues: string[] = [];

  const questions = blocks
    .map((block, index) => parseQuestionBlock(block.lines, index, block.startLine, formatIssues))
    .filter((question): question is QuizQuestion => Boolean(question));

  const validation = validateQuestions(questions, formatIssues);
  const now = new Date().toISOString();

  return quizDocumentSchema.parse({
    id: crypto.randomUUID(),
    title: options.title || "Новый тест",
    sourceFormat: options.format ?? "qst",
    sourceFileName: options.fileName,
    encoding: options.encoding,
    questions,
    validation,
    createdAt: now,
    updatedAt: now,
  });
}

function decodeBytes(bytes?: Uint8Array): DecodedText {
  if (!bytes) {
    return { text: "", encoding: "utf-8" };
  }

  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      encoding: "utf-8",
    };
  } catch {
    return {
      text: new TextDecoder("windows-1251").decode(bytes),
      encoding: "windows-1251",
    };
  }
}

async function extractZipCandidates(file: File): Promise<ImportCandidate[]> {
  const zip = await JSZip.loadAsync(file);
  const candidates: ImportCandidate[] = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue;
    }

    const extension = extensionOf(entry.name);

    if (DANGEROUS_EXTENSIONS.has(extension)) {
      candidates.push({
        id: crypto.randomUUID(),
        name: entry.name,
        extension: "zip",
        size: 0,
        ignored: true,
        reason: "Опасные файлы внутри ZIP игнорируются и никогда не запускаются.",
      });
      continue;
    }

    if (!DISCOVERABLE_EXTENSIONS.has(extension)) {
      continue;
    }

    const bytes = new Uint8Array(await entry.async("arraybuffer"));
    candidates.push({
      id: crypto.randomUUID(),
      name: entry.name,
      extension: extension as SourceFormat,
      size: bytes.byteLength,
      bytes,
      ignored: !SUPPORTED_TEXT_EXTENSIONS.has(extension),
      reason: SUPPORTED_TEXT_EXTENSIONS.has(extension)
        ? undefined
        : "Файл найден в архиве, но MVP сейчас распознаёт только QST/TXT.",
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      id: crypto.randomUUID(),
      name: file.name,
      extension: "zip",
      size: file.size,
      ignored: true,
      reason: "В архиве не нашлось QST или TXT файлов.",
    });
  }

  return candidates;
}

function splitIntoQuestionBlocks(text: string) {
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: Array<{ lines: string[]; startLine: number }> = [];
  let current: string[] = [];
  let startLine = 1;

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();

    if (line === "?") {
      if (current.length > 0) {
        blocks.push({ lines: current, startLine });
      }
      current = [];
      startLine = lineIndex + 2;
      return;
    }

    if (line.length === 0) {
      return;
    }

    current.push(rawLine.trim());
  });

  if (current.length > 0) {
    blocks.push({ lines: current, startLine });
  }

  return blocks;
}

function parseQuestionBlock(
  lines: string[],
  index: number,
  startLine: number,
  formatIssues: string[]
): QuizQuestion | null {
  const questionLine = lines.find((line) => !line.startsWith("+") && !line.startsWith("-"));

  if (!questionLine) {
    formatIssues.push(`Блок ${index + 1}: не найден текст вопроса.`);
    return null;
  }

  const parsedNumber = parseQuestionNumber(questionLine, index + 1);
  const answers: QuizAnswer[] = [];

  lines.forEach((line, answerIndex) => {
    if (!line.startsWith("+") && !line.startsWith("-")) {
      return;
    }

    const text = line.slice(1).trim();
    if (!text) {
      formatIssues.push(`Вопрос ${parsedNumber.number}: пустой вариант ответа.`);
      return;
    }

    answers.push({
      id: `q${parsedNumber.number}-a${answerIndex + 1}`,
      text,
      correct: line.startsWith("+"),
    });
  });

  const correctCount = answers.filter((answer) => answer.correct).length;
  const status: QuizQuestion["status"] =
    correctCount === 1 && answers.length >= 2 ? "valid" : correctCount === 0 ? "invalid" : "needs_review";

  return {
    id: `q${parsedNumber.number}`,
    number: parsedNumber.number,
    text: parsedNumber.text,
    answers,
    status,
    sourceLine: startLine,
  };
}

function parseQuestionNumber(line: string, fallback: number) {
  const match = line.match(/^\s*(\d+)[.)]?\s*(.*)$/);

  if (!match) {
    return { number: fallback, text: line.trim() };
  }

  return {
    number: Number(match[1]),
    text: match[2]?.trim() || line.trim(),
  };
}

function validateQuestions(questions: QuizQuestion[], issues: string[]): QuizValidation {
  const numbers = questions.map((question) => question.number).sort((a, b) => a - b);
  const missingNumbers: number[] = [];
  const min = numbers[0] ?? 1;
  const max = numbers[numbers.length - 1] ?? 0;

  for (let number = min; number <= max; number += 1) {
    if (!numbers.includes(number)) {
      missingNumbers.push(number);
    }
  }

  const questionsWithoutCorrectAnswer: number[] = [];
  const questionsWithMultipleCorrectAnswers: number[] = [];
  const questionsWithTooFewAnswers: number[] = [];
  const questionsWithDuplicateAnswers: number[] = [];

  questions.forEach((question) => {
    const correctCount = question.answers.filter((answer) => answer.correct).length;
    const normalizedAnswers = question.answers.map((answer) => answer.text.trim().toLowerCase());
    const uniqueAnswers = new Set(normalizedAnswers);

    if (correctCount === 0) {
      questionsWithoutCorrectAnswer.push(question.number);
    }
    if (correctCount > 1) {
      questionsWithMultipleCorrectAnswers.push(question.number);
    }
    if (question.answers.length < 2) {
      questionsWithTooFewAnswers.push(question.number);
    }
    if (uniqueAnswers.size !== normalizedAnswers.length) {
      questionsWithDuplicateAnswers.push(question.number);
    }
  });

  return {
    totalQuestions: questions.length,
    totalAnswers: questions.reduce((sum, question) => sum + question.answers.length, 0),
    totalCorrectAnswers: questions.reduce(
      (sum, question) => sum + question.answers.filter((answer) => answer.correct).length,
      0
    ),
    missingNumbers,
    questionsWithoutCorrectAnswer,
    questionsWithMultipleCorrectAnswers,
    questionsWithTooFewAnswers,
    questionsWithDuplicateAnswers,
    formatIssues: issues,
  };
}

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function cleanTitle(name: string) {
  const base = name.split("/").pop()?.replace(/\.[^.]+$/, "") ?? name;
  return base.replace(/[_-]+/g, " ").trim() || "Новый тест";
}
