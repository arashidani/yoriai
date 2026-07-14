'use client'

import { AlertTriangle, MessageSquareWarning, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { client } from '@/lib/hono/client'

const SEVERITY_ICONS = {
  HIGH: ShieldAlert,
  MEDIUM: MessageSquareWarning,
  LOW: AlertTriangle,
} as const

const SEVERITY_LABELS: Record<string, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' }
const SEVERITY_STYLES: Record<string, string> = {
  HIGH: 'bg-destructive/10 text-destructive',
  MEDIUM: 'bg-primary/10 text-primary',
  LOW: 'bg-muted text-muted-foreground',
}

type AiFlag = {
  id: string
  title: string
  detail: string
  severity: keyof typeof SEVERITY_ICONS
  status: 'UNREAD' | 'CONFIRMED'
  targetUser: { name: string | null } | null
  createdAt: Date | string
}

function StatusBadge({ status }: { status: AiFlag['status'] }) {
  const isUnread = status === 'UNREAD'
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
        isUnread ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'
      }`}
    >
      {isUnread ? '未確認' : '確認済み'}
    </span>
  )
}

export function AiFlagList({ flags: initialFlags }: { flags: AiFlag[] }) {
  const [flags, setFlags] = useState(initialFlags)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const unreadCount = flags.filter((f) => f.status === 'UNREAD').length

  async function handleConfirm(id: string) {
    setPendingId(id)
    const res = await client.api.admin['ai-flags'][':id'].$patch({ param: { id } })
    setPendingId(null)

    if (!res.ok) {
      toast.error('更新に失敗しました')
      return
    }

    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'CONFIRMED' } : f)))
    toast.success('確認済みにしました')
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {unreadCount > 0 && (
        <span className="inline-block text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
          未確認 {unreadCount} 件
        </span>
      )}
      {flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">フラグはありません</p>
      ) : (
        flags.map((flag) => {
          const Icon = SEVERITY_ICONS[flag.severity]
          return (
            <div key={flag.id} className="rounded-xl border p-5 flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-medium">{flag.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${SEVERITY_STYLES[flag.severity]}`}
                  >
                    {SEVERITY_LABELS[flag.severity]}
                  </span>
                  <StatusBadge status={flag.status} />
                </div>
                <p className="text-sm text-muted-foreground">{flag.detail}</p>
                <p className="text-xs text-muted-foreground">
                  対象ユーザー: {flag.targetUser?.name ?? '不明'} ・{' '}
                  {new Date(flag.createdAt).toLocaleString('ja-JP')}
                </p>
              </div>
              <button
                type="button"
                disabled={flag.status === 'CONFIRMED' || pendingId === flag.id}
                onClick={() => handleConfirm(flag.id)}
                className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border text-muted-foreground disabled:opacity-50"
              >
                {flag.status === 'CONFIRMED' ? '確認済み' : '確認済みにする'}
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
