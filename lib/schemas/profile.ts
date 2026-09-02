import { z } from 'zod'
import { onboardingSchema } from '@/lib/schemas/onboarding'

export const updateProfileSchema = onboardingSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, '氏名を入力してください')
    .max(100, '氏名は100文字以内で入力してください'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
