import {
  BADGE_ICONS,
  type BadgeIconName,
  RARITY_LABELS,
  RARITY_STYLES,
} from '@/components/admin/badge-icons'
import { MOCK_BADGES } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

async function getBadges() {
  if (process.env.MOCK_MODE === 'true') return MOCK_BADGES
  return prisma.badge.findMany({ orderBy: { createdAt: 'desc' } })
}

export default async function BadgePage() {
  const badges = await getBadges()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">バッジ管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          ユーザーの行動に応じて付与されるバッジの一覧
        </p>
      </div>

      {badges.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだバッジがありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b) => {
            const Icon = BADGE_ICONS[b.icon as BadgeIconName] ?? BADGE_ICONS.Medal
            return (
              <div key={b.id} className="rounded-xl border p-5 space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{b.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${RARITY_STYLES[b.rarity]}`}
                  >
                    {RARITY_LABELS[b.rarity]}
                  </span>
                  <span className="text-xs text-muted-foreground">{b.earnedCount}人が獲得</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
