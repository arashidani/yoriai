import { describe, expect, it } from 'vitest'
import { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import { onboardingSchema, reorderProfileOptionsSchema } from '@/lib/schemas/onboarding'

const validInput = {
  username: 'みどりさん',
  departmentId: 'department-1',
  businessAreaId: 'business-area-1',
  joinedYear: 2024,
  joinedMonth: 4,
  businessSkillIds: ['skill-1'],
  interestIds: ['interest-1'],
  lunchPreference: LunchPreference.NO_PREFERENCE,
  recommendedLunchSpot: '',
  bio: '',
  displayNameColor: DisplayNameColor.GREEN,
}

describe('onboardingSchema', () => {
  it('必須項目が揃った入力を許可する', () => {
    expect(onboardingSchema.safeParse(validInput).success).toBe(true)
  })

  it('ビジネススキルと興味が空の場合は拒否する', () => {
    expect(
      onboardingSchema.safeParse({ ...validInput, businessSkillIds: [], interestIds: [] }).success,
    ).toBe(false)
  })

  it('任意テキストの文字数上限を検証する', () => {
    expect(
      onboardingSchema.safeParse({ ...validInput, recommendedLunchSpot: 'あ'.repeat(21) }).success,
    ).toBe(false)
    expect(onboardingSchema.safeParse({ ...validInput, bio: 'あ'.repeat(201) }).success).toBe(false)
  })

  it('重複した選択肢IDを拒否する', () => {
    expect(
      onboardingSchema.safeParse({
        ...validInput,
        businessSkillIds: ['skill-1', 'skill-1'],
      }).success,
    ).toBe(false)
  })
})

describe('reorderProfileOptionsSchema', () => {
  it('重複のない項目IDを許可する', () => {
    expect(
      reorderProfileOptionsSchema.safeParse({ orderedIds: ['option-2', 'option-1'] }).success,
    ).toBe(true)
  })

  it('空または重複した項目IDを拒否する', () => {
    expect(reorderProfileOptionsSchema.safeParse({ orderedIds: [] }).success).toBe(false)
    expect(
      reorderProfileOptionsSchema.safeParse({ orderedIds: ['option-1', 'option-1'] }).success,
    ).toBe(false)
  })
})
