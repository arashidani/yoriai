import { AnonymousProfileList } from '@/components/admin/anonymous-profile-list'
import { MOCK_ANONYMOUS_PROFILES } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

async function getAnonymousProfiles() {
  if (process.env.MOCK_MODE === 'true') return MOCK_ANONYMOUS_PROFILES
  return prisma.anonymousProfile.findMany({ orderBy: { createdAt: 'asc' } })
}

export default async function AnonymousProfilesPage() {
  const profiles = await getAnonymousProfiles()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">匿名キャラ管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          質問スレッド内でユーザーに割り当てる匿名キャラの候補を管理します。無効化すると新規の割り当て候補から外れますが、既存スレッドでの表示は変わりません。すでに割り当て済みのキャラは削除できません。
        </p>
      </div>

      <AnonymousProfileList profiles={profiles} />
    </div>
  )
}
