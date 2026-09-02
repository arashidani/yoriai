import { z } from 'zod'

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'タグ名を入力してください')
    .max(50, 'タグ名は50文字以内で入力してください'),
  category: z
    .string()
    .min(1, 'カテゴリーを入力してください')
    .max(50, 'カテゴリーは50文字以内で入力してください'),
  description: z.string().max(500, '説明は500文字以内で入力してください').optional(),
  isWorkTag: z.boolean(),
})

export type CreateTagInput = z.infer<typeof createTagSchema>

export const updateTagSchema = createTagSchema
export type UpdateTagInput = z.infer<typeof updateTagSchema>
