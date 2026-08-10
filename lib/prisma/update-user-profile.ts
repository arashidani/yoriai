import { prisma } from '@/lib/prisma/client'
import type { OnboardingInput } from '@/lib/schemas/onboarding'

type ProfileInput = OnboardingInput & { name?: string }

export async function updateUserProfile(
  userId: string,
  data: ProfileInput,
  completeOnboarding = false,
) {
  return prisma.$transaction(async (tx) => {
    const [department, businessArea, businessSkillCount, interestCount] = await Promise.all([
      tx.department.findFirst({
        where: {
          id: data.departmentId,
          OR: [{ isActive: true }, { users: { some: { id: userId } } }],
        },
      }),
      tx.businessArea.findFirst({
        where: {
          id: data.businessAreaId,
          OR: [{ isActive: true }, { users: { some: { id: userId } } }],
        },
      }),
      tx.businessSkill.count({
        where: {
          id: { in: data.businessSkillIds },
          OR: [{ isActive: true }, { users: { some: { userId } } }],
        },
      }),
      tx.interest.count({
        where: {
          id: { in: data.interestIds },
          OR: [{ isActive: true }, { users: { some: { userId } } }],
        },
      }),
    ])

    if (
      !department ||
      !businessArea ||
      businessSkillCount !== data.businessSkillIds.length ||
      interestCount !== data.interestIds.length
    ) {
      return false
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        ...(data.name === undefined ? {} : { name: data.name }),
        username: data.username,
        departmentId: data.departmentId,
        businessAreaId: data.businessAreaId,
        joinedYear: data.joinedYear,
        joinedMonth: data.joinedMonth,
        lunchPreference: data.lunchPreference,
        recommendedLunchSpot: data.recommendedLunchSpot || null,
        bio: data.bio || null,
        displayNameColor: data.displayNameColor,
        ...(completeOnboarding ? { onboardingCompletedAt: new Date() } : {}),
        businessSkills: {
          deleteMany: {},
          create: data.businessSkillIds.map((businessSkillId) => ({ businessSkillId })),
        },
        interests: {
          deleteMany: {},
          create: data.interestIds.map((interestId) => ({ interestId })),
        },
      },
    })

    return true
  })
}
