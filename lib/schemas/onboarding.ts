import { z } from 'zod'
import { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'

const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length

export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'ニックネームを入力してください')
    .max(100, 'ニックネームは100文字以内で入力してください'),
  departmentId: z.string().min(1, '所属部署を選択してください'),
  businessAreaId: z.string().min(1, '業務エリアを選択してください'),
  joinedYear: z
    .number({ error: '入社年を選択してください' })
    .int()
    .min(1900, '入社年を選択してください')
    .max(new Date().getFullYear(), '入社年が正しくありません'),
  joinedMonth: z
    .number({ error: '入社月を選択してください' })
    .int()
    .min(1, '入社月を選択してください')
    .max(12),
  businessSkillIds: z
    .array(z.string().min(1))
    .min(1, 'ビジネススキルを1つ以上選択してください')
    .refine(uniqueIds, '同じビジネススキルを重複して選択できません'),
  interestIds: z
    .array(z.string().min(1))
    .refine(uniqueIds, '同じ興味を重複して選択できません')
    .optional(),
  lunchPreference: z.nativeEnum(LunchPreference),
  recommendedLunchSpot: z
    .string()
    .trim()
    .max(20, 'おすすめランチスポットは20文字以内で入力してください')
    .optional(),
  bio: z.string().trim().max(200, '一言は200文字以内で入力してください').optional(),
  displayNameColor: z.nativeEnum(DisplayNameColor).optional(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>

export const profileOptionCategorySchema = z.enum([
  'departments',
  'business-areas',
  'business-skills',
  'interests',
])

export type ProfileOptionCategory = z.infer<typeof profileOptionCategorySchema>

export const createProfileOptionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '項目名を入力してください')
    .max(100, '項目名は100文字以内で入力してください'),
})

export const updateProfileOptionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, '項目名を入力してください')
      .max(100, '項目名は100文字以内で入力してください')
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.isActive !== undefined, {
    message: '変更内容を指定してください',
  })

export const reorderProfileOptionsSchema = z.object({
  orderedIds: z
    .array(z.string().min(1))
    .min(1, '並び順を指定してください')
    .refine(uniqueIds, '同じ項目を重複して指定できません'),
})

export type CreateProfileOptionInput = z.infer<typeof createProfileOptionSchema>
export type UpdateProfileOptionInput = z.infer<typeof updateProfileOptionSchema>
