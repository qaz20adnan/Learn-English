import { z } from 'zod';

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'الاسم قصير جدًا').max(80, 'الاسم طويل جدًا'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => emailPattern.test(value), 'البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 أحرف').max(200),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => emailPattern.test(value), 'البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة').max(200),
});

export const lessonProgressSchema = z.object({
  lessonId: z.string().min(1),
  positionSeconds: z.number().finite().nonnegative().max(60 * 60 * 24),
  percent: z.number().min(0).max(100),
  completed: z.boolean().optional(),
});

export const settingsSchema = z.object({
  dailyGoalMinutes: z.number().int().min(5).max(240).optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  uiLanguage: z.enum(['ar', 'en']).optional(),
});

export const reviewSchema = z.object({
  vocabId: z.string().min(1),
  grade: z.enum(['again', 'hard', 'good', 'easy']),
});

export const storyAttemptSchema = z.object({
  storyId: z.string().min(1),
  answers: z.array(z.number().int().min(0).max(20)).max(50),
});

export const favoriteSchema = z.object({
  vocabId: z.string().min(1),
  favorite: z.boolean(),
});

export const wordSchema = z.object({
  term: z.string().trim().min(1, 'الكلمة مطلوبة').max(60, 'الكلمة طويلة جدًا'),
  translation: z.string().trim().min(1, 'الترجمة مطلوبة').max(120, 'الترجمة طويلة جدًا'),
  partOfSpeech: z.string().trim().max(30).optional(),
  phonetic: z.string().trim().max(60).optional(),
  example: z.string().trim().max(300).optional(),
});

export const quizAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(50).nullable().optional(),
  booleanAnswer: z.boolean().nullable().optional(),
  textAnswer: z.string().max(200).nullable().optional(),
});

export const quizAttemptSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(quizAnswerSchema).max(100),
});

export const mediaVerifySchema = z.object({
  mediaId: z.string().min(1),
});

export const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['STUDENT', 'ADMIN']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
