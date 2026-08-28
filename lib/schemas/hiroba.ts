import { z } from 'zod'

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
  mentionedUserIds: z.array(z.string().min(1)).max(50).optional(),
})

export type CreateHirobaAnswerInput = z.infer<typeof createHirobaAnswerSchema>
