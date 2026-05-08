import { z } from "zod";

export const answerSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  correct: z.boolean(),
});

export const questionSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  text: z.string().min(1),
  answers: z.array(answerSchema).min(1),
  status: z.enum(["valid", "needs_review", "invalid"]),
  flagged: z.boolean().optional(),
  favorite: z.boolean().optional(),
  difficult: z.boolean().optional(),
  explanation: z.string().optional(),
  sourceLine: z.number().optional(),
});

export const validationSchema = z.object({
  totalQuestions: z.number().int().nonnegative(),
  totalAnswers: z.number().int().nonnegative(),
  totalCorrectAnswers: z.number().int().nonnegative(),
  missingNumbers: z.array(z.number().int().positive()),
  questionsWithoutCorrectAnswer: z.array(z.number().int().positive()),
  questionsWithMultipleCorrectAnswers: z.array(z.number().int().positive()),
  questionsWithTooFewAnswers: z.array(z.number().int().positive()),
  questionsWithDuplicateAnswers: z.array(z.number().int().positive()),
  formatIssues: z.array(z.string()),
});

export const quizDocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  sourceFormat: z.enum(["qst", "txt", "zip", "docx", "xlsx"]),
  sourceFileName: z.string().optional(),
  encoding: z.string().optional(),
  questions: z.array(questionSchema),
  validation: validationSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
