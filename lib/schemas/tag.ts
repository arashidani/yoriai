import { z } from 'zod'

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'タグ名を入力してください')
    .max(50, 'タグ名は50文字以内で入力してください'),
})

export type CreateTagInput = z.infer<typeof createTagSchema>
