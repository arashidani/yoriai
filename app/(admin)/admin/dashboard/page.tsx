import { Users, FileText, Flag, TrendingUp } from 'lucide-react'

const stats = [
  { label: '総ユーザー数', value: '1,284', delta: '+4.2%', icon: Users },
  { label: '総投稿数', value: '9,731', delta: '+1.8%', icon: FileText },
  { label: 'フラグ件数', value: '12', delta: '-3件', icon: Flag },
  { label: '本日のアクティブ数', value: '312', delta: '+9.6%', icon: TrendingUp },
]

const activity = [
  { name: '田中 陽子', action: 'アカウントを作成しました', time: '3分前' },
  { name: '佐藤 健', action: '投稿を編集しました', time: '18分前' },
  { name: 'AIフラグ', action: '不適切な表現を検出しました', time: '42分前' },
  { name: '山本 直樹', action: 'ログインしました', time: '1時間前' },
]

const weekly = [40, 65, 50, 80, 55, 90, 70]
const days = ['月', '火', '水', '木', '金', '土', '日']

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">ダッシュボード</h2>
        <p className="text-sm text-muted-foreground mt-1">システム全体の概況</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stat.delta}</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border p-6">
          <h3 className="text-sm font-medium mb-6">週間アクティビティ</h3>
          <div className="flex items-end justify-between gap-3 h-40">
            {weekly.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-primary/80"
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="text-sm font-medium mb-4">最近のアクティビティ</h3>
          <ul className="space-y-4">
            {activity.map((item, i) => (
              <li key={i} className="text-sm">
                <p>
                  <span className="font-medium">{item.name}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}