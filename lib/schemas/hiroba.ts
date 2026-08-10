import { z } from 'zod'

export const createHirobaSchema = z.object({
  name: z
    .string()
    .min(1, 'ひろば名を入力してください')
    .max(50, 'ひろば名は50文字以内で入力してください'),
  description: z
    .string()
    .min(1, '説明を入力してください')
    .max(200, '説明は200文字以内で入力してください'),
})

export type CreateHirobaInput = z.infer<typeof createHirobaSchema>

export const createHirobaPostSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  body: z.string().min(1, '本文は必須です'),
})

export type CreateHirobaPostInput = z.infer<typeof createHirobaPostSchema>

export const createHirobaAnswerSchema = z.object({
  body: z.string().min(1, '本文は必須です'),
})

export type CreateHirobaAnswerInput = z.infer<typeof createHirobaAnswerSchema>
