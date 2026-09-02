import { notFound } from 'next/navigation'
import { HirobaSidebar } from '@/components/hiroba/hiroba-sidebar'
import { BackButton } from '@/components/mypage/back-button'
import { ProfileView } from '@/components/mypage/profile-form'
import { getPopularPosts } from '@/lib/hiroba/posts'
import {
  MOCK_BUSINESS_AREAS,
  MOCK_BUSINESS_SKILLS,
  MOCK_DEPARTMENTS,
  MOCK_INTERESTS,
  MOCK_USERS,
} from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getProfile(userId: string) {
  if (process.env.MOCK_MODE === 'true') {
    const user = MOCK_USERS.find((item) => item.id === userId)
    return user
      ? {
          ...user,
          createdAt: user.createdAt.toISOString(),
          businessSkillIds: [],
          interestIds: [],
        }
      : null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businessSkills: { select: { businessSkillId: true } },
      interests: { select: { interestId: true } },
    },
  })
  if (!user) return null

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    businessSkillIds: user.businessSkills.map((item) => item.businessSkillId),
    interestIds: user.interests.map((item) => item.interestId),
  }
}

async function getOptions() {
  if (process.env.MOCK_MODE === 'true') {
    return {
      departments: MOCK_DEPARTMENTS,
      businessAreas: MOCK_BUSINESS_AREAS,
      businessSkills: MOCK_BUSINESS_SKILLS,
      interests: MOCK_INTERESTS,
    }
  }

  const [departments, businessAreas, businessSkills, interests] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.businessArea.findMany({ orderBy: { name: 'asc' } }),
    prisma.businessSkill.findMany({ orderBy: { name: 'asc' } }),
    prisma.interest.findMany({ orderBy: { name: 'asc' } }),
  ])
  return { departments, businessAreas, businessSkills, interests }
}

export default async function PublicMyPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const [profile, options, popularPosts] = await Promise.all([
    getProfile(userId),
    getOptions(),
    getPopularPosts(),
  ])
  if (!profile) notFound()

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="flex items-start gap-8">
        <section className="min-w-0 flex-1 space-y-8">
          <BackButton />
          <ProfileView profile={profile} options={options} avatarUrl={profile.avatarUrl} />
        </section>

        <HirobaSidebar popularPosts={popularPosts} />
      </div>
    </div>
  )
}
