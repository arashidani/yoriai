import { z } from 'zod'

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  body: z.string().min(1, '本文は必須です'),
  tagId: z.string().min(1).optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>

export const assignQuestionTagSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('ai') }),
  z.object({ mode: z.literal('manual'), tagId: z.string().min(1, 'タグを選択してください') }),
])

export type AssignQuestionTagInput = z.infer<typeof assignQuestionTagSchema>
