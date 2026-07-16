import { AiFlagList } from '@/components/admin/ai-flag-list'
import { MOCK_AI_FLAGS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

async function getAiFlags() {
  if (process.env.MOCK_MODE === 'true') return MOCK_AI_FLAGS
  return prisma.aiFlag.findMany({
    include: { targetUser: true, post: true },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function AiFlagsPage() {
  const flags = await getAiFlags()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AIフラグ</h2>
        <p className="text-sm text-muted-foreground mt-1">AIが検出した不審なアクティビティ</p>
      </div>

      <AiFlagList flags={flags} />
    </div>
  )
}
