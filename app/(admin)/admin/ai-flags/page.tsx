import { AlertTriangle, ShieldAlert, MessageSquareWarning, Eye } from 'lucide-react'

const flags = [
  {
    icon: ShieldAlert,
    title: '攻撃的な表現を検出',
    detail: '投稿「業務効率化について」内に、攻撃的とみられる表現が含まれています',
    user: '田中 陽子',
    severity: '高',
    status: '未確認',
    time: '12分前',
  },
  {
    icon: MessageSquareWarning,
    title: '個人情報の投稿を検出',
    detail: 'コメント内に電話番号のようなパターンが含まれています',
    user: '山本 直樹',
    severity: '中',
    status: '未確認',
    time: '47分前',
  },
  {
    icon: AlertTriangle,
    title: '短時間での連続投稿',
    detail: '5分間に8件の投稿を検出しました。スパムの可能性があります',
    user: '鈴木 美咲',
    severity: '中',
    status: '確認済み',
    time: '2時間前',
  },
  {
    icon: ShieldAlert,
    title: '不審なログイン試行',
    detail: '通常と異なる地域からのログインを検出しました',
    user: '佐藤 健',
    severity: '高',
    status: '確認済み',
    time: '5時間前',
  },
]

function SeverityBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    高: 'bg-destructive/10 text-destructive',
    中: 'bg-primary/10 text-primary',
    低: 'bg-muted text-muted-foreground',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${styles[level]}`}>
      {level}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isUnread = status === '未確認'
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
        isUnread ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'
      }`}
    >
      {status}
    </span>
  )
}

export default function AiFlagsPage() {
  const unreadCount = flags.filter((f) => f.status === '未確認').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AIフラグ</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AIが検出した不審なアクティビティ
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
            未確認 {unreadCount} 件
          </span>
        )}
      </div>

      <div className="space-y-3 max-w-2xl">
        {flags.map((flag, i) => (
          <div key={i} className="rounded-xl border p-5 flex items-start gap-4">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <flag.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-medium">{flag.title}</h3>
                <SeverityBadge level={flag.severity} />
                <StatusBadge status={flag.status} />
              </div>
              <p className="text-sm text-muted-foreground">{flag.detail}</p>
              <p className="text-xs text-muted-foreground">
                対象ユーザー: {flag.user} ・ {flag.time}
              </p>
            </div>
            <button
              disabled
              className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border text-muted-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
              詳細
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}