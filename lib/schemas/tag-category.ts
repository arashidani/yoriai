import { z } from 'zod'

export const createTagCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'カテゴリー名を入力してください')
    .max(50, 'カテゴリー名は50文字以内で入力してください'),
})

export type CreateTagCategoryInput = z.infer<typeof createTagCategorySchema>
