import { z } from 'zod'

export const createAnonymousProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください'),
})

export type CreateAnonymousProfileInput = z.infer<typeof createAnonymousProfileSchema>

export const updateAnonymousProfileSchema = z
  .object({
    isActive: z.boolean().optional(),
    avatarUrls: z.array(z.string().min(1)).max(20, 'アバターは20枚までです').optional(),
  })
  .refine((value) => value.isActive !== undefined || value.avatarUrls !== undefined, {
    message: '更新内容を指定してください',
  })

export type UpdateAnonymousProfileInput = z.infer<typeof updateAnonymousProfileSchema>
