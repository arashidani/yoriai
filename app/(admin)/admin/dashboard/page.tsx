import { FileText, Flag, TrendingUp, Users } from 'lucide-react'
import { Role } from '@/app/generated/prisma/enums'
import { MOCK_AI_FLAGS, MOCK_POSTS, MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

type DashboardUser = { id: string; name: string | null; role: string; createdAt: Date }
type DashboardPost = {
  id: string
  title: string
  createdAt: Date
  author: { name: string | null } | null
}
type DashboardFlag = { status: string }

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatRelativeTime(time: Date) {
  const diffMin = Math.floor((Date.now() - time.getTime()) / 60000)
  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}時間前`
  return `${Math.floor(diffHour / 24)}日前`
}

function buildDashboardData(
  users: DashboardUser[],
  posts: DashboardPost[],
  flags: DashboardFlag[],
) {
  const stats = [
    { label: '総ユーザー数', value: users.length.toLocaleString(), icon: Users },
    { label: '総投稿数', value: posts.length.toLocaleString(), icon: FileText },
    {
      label: '未確認フラグ',
      value: flags.filter((f) => f.status === 'UNREAD').length.toLocaleString(),
      icon: Flag,
    },
    {
      label: '管理者数',
      value: users.filter((u) => u.role === Role.ADMIN).length.toLocaleString(),
      icon: TrendingUp,
    },
  ]

  const activity = [
    ...users.map((u) => ({
      name: u.name ?? 'ユーザー',
      action: 'アカウントを作成しました',
      time: u.createdAt,
    })),
    ...posts.map((p) => ({
      name: p.author?.name ?? '不明なユーザー',
      action: `投稿「${p.title}」を作成しました`,
      time: p.createdAt,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 4)

  const today = new Date()
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - i))
    return {
      count: posts.filter((p) => isSameDay(p.createdAt, day)).length,
      label: WEEKDAY_LABELS[day.getDay()],
    }
  })
  const maxCount = Math.max(1, ...weekly.map((w) => w.count))

  return { stats, activity, weekly, maxCount }
}

async function getDashboardData() {
  if (process.env.MOCK_MODE === 'true') {
    return buildDashboardData(MOCK_USERS, MOCK_POSTS, MOCK_AI_FLAGS)
  }
  const [users, posts, flags] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.post.findMany({ include: { author: true }, orderBy: { createdAt: 'desc' } }),
    prisma.aiFlag.findMany(),
  ])
  return buildDashboardData(users, posts, flags)
}

export default async function DashboardPage() {
  const { stats, activity, weekly, maxCount } = await getDashboardData()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">ダッシュボード</h2>
        <p className="text-sm text-muted-foreground mt-1">システム全体の概況</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border p-5 space-y-3">
            <stat.icon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border p-6">
          <h3 className="text-sm font-medium mb-6">週間投稿数</h3>
          <div className="flex items-end justify-between gap-3 h-40">
            {weekly.map((w) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-primary/80"
                  style={{ height: `${Math.max(4, (w.count / maxCount) * 100)}%` }}
                />
                <span className="text-xs text-muted-foreground">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="text-sm font-medium mb-4">最近のアクティビティ</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだアクティビティがありません</p>
          ) : (
            <ul className="space-y-4">
              {activity.map((item) => (
                <li key={`${item.name}-${item.action}-${item.time.getTime()}`} className="text-sm">
                  <p>
                    <span className="font-medium">{item.name}</span>{' '}
                    <span className="text-muted-foreground">{item.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(item.time)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
