import Image from 'next/image'
import { notFound } from 'next/navigation'
import imageNone from '@/assets/image-none.svg'
import { displayNameColorClass } from '@/components/hiroba/display-name-color'
import { ProfileField } from '@/components/mypage/profile-field'
import { MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

const lunchLabels = {
  NO_PREFERENCE: 'こだわりない',
  TEAM: 'チームで',
  ALONE: '一人で',
} as const

async function getProfile(userId: string) {
  if (process.env.MOCK_MODE === 'true') {
    const user = MOCK_USERS.find((item) => item.id === userId)
    return user
      ? { ...user, department: null, businessArea: null, businessSkills: [], interests: [] }
      : null
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: { select: { name: true } },
      businessArea: { select: { name: true } },
      businessSkills: { include: { businessSkill: { select: { name: true } } } },
      interests: { include: { interest: { select: { name: true } } } },
    },
  })
}

export default async function PublicMyPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const profile = await getProfile(userId)
  if (!profile) notFound()

  const displayName = profile.username ?? profile.name ?? 'ユーザー'
  const businessSkills = profile.businessSkills.map((item) => item.businessSkill.name)
  const interests = profile.interests.map((item) => item.interest.name)

  return (
    <section className="mx-auto w-full max-w-3xl p-8">
      <div className="flex gap-8">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt=""
            width={140}
            height={140}
            unoptimized
            className="size-35 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <Image src={imageNone} alt="" className="size-35 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0 pt-3">
          <h1 className={`text-heading-3 ${displayNameColorClass(profile.displayNameColor)}`}>
            {displayName}
          </h1>
          <p className="mt-1 text-paragraph-small text-muted-foreground">プロフィール</p>
        </div>
      </div>

      <div className="mt-8 border-t border-input pt-3">
        <ProfileField label="所属部署" value={profile.department?.name ?? '未選択'} />
        <ProfileField label="勤務エリア" value={profile.businessArea?.name ?? '未選択'} />
        <ProfileField
          label="入社年月"
          value={
            profile.joinedYear && profile.joinedMonth
              ? `${profile.joinedYear}年 ${profile.joinedMonth}月`
              : '未選択'
          }
        />
        <ProfileField
          label="ビジネススキル"
          value={businessSkills.length ? businessSkills : '未選択'}
        />
        <ProfileField label="趣味" value={interests.length ? interests : '未選択'} />
        <ProfileField
          label="ランチスタイル"
          value={profile.lunchPreference ? lunchLabels[profile.lunchPreference] : '未選択'}
        />
        <ProfileField label="ランチスポット" value={profile.recommendedLunchSpot ?? '未入力'} />
        <ProfileField label="ひとこと" value={profile.bio?.split('\n') ?? '未入力'} />
      </div>
    </section>
  )
}
