import { z } from 'zod'

export const createAnonymousProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください'),
  avatarUrl: z.string().min(1, 'アイコンのURLを入力してください'),
})

export type CreateAnonymousProfileInput = z.infer<typeof createAnonymousProfileSchema>

export const updateAnonymousProfileSchema = z.object({
  isActive: z.boolean(),
})

export type UpdateAnonymousProfileInput = z.infer<typeof updateAnonymousProfileSchema>
