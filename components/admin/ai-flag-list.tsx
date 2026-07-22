'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, MessageSquareWarning, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DeletePostButton } from '@/components/posts/delete-post-button'
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
  post: { id: string; title: string; deletedAt: Date | string | null } | null
  answer: { id: string; body: string; isHidden: boolean } | null
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

async function fetchFlags(): Promise<AiFlag[]> {
  const res = await client.api.admin['ai-flags'].$get()
  if (!res.ok) throw new Error('Failed to fetch flags')
  const data = await res.json()
  return data.flags.map((flag) => ({
    ...flag,
    targetUser: flag.targetUser ?? null,
    post: flag.post ?? null,
    answer: flag.answer ?? null,
  }))
}

export function AiFlagList() {
  const queryClient = useQueryClient()
  const {
    data: flags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['aiFlags'],
    queryFn: fetchFlags,
  })
  const unreadCount = flags.filter((f) => f.status === 'UNREAD').length

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.admin['ai-flags'][':id'].$patch({ param: { id } })
      if (!res.ok) throw new Error('Failed to confirm flag')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFlags'] })
      toast.success('確認済みにしました')
    },
    onError: () => {
      toast.error('更新に失敗しました')
    },
  })

  const restorePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.admin.posts[':id'].restore.$patch({ param: { id } })
      if (!res.ok) throw new Error('Failed to restore post')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFlags'] })
      toast.success('投稿を復元しました')
    },
    onError: () => {
      toast.error('復元に失敗しました')
    },
  })

  const restoreAnswerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.admin.answers[':id'].restore.$patch({ param: { id } })
      if (!res.ok) throw new Error('Failed to restore answer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFlags'] })
      toast.success('回答を復元しました')
    },
    onError: () => {
      toast.error('復元に失敗しました')
    },
  })

  function handleConfirm(id: string) {
    confirmMutation.mutate(id)
  }

  function handleDeleted() {
    queryClient.invalidateQueries({ queryKey: ['aiFlags'] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">AIフラグの取得に失敗しました</div>
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
                {flag.post && (
                  <Link
                    href={`/posts/${flag.post.id}`}
                    className="inline-block text-xs underline underline-offset-4 text-muted-foreground hover:text-primary"
                  >
                    該当の投稿を見る: {flag.post.title}
                  </Link>
                )}
                {flag.post?.deletedAt && (
                  <p className="text-xs text-destructive">この投稿は自動的に非表示になっています</p>
                )}
                {flag.answer && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    該当の回答: {flag.answer.body}
                  </p>
                )}
                {flag.answer?.isHidden && (
                  <p className="text-xs text-destructive">この回答は自動的に非表示になっています</p>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {flag.post?.deletedAt && (
                  <button
                    type="button"
                    disabled={restorePostMutation.isPending}
                    onClick={() => flag.post && restorePostMutation.mutate(flag.post.id)}
                    className="text-xs px-3 py-1.5 rounded-md border text-muted-foreground disabled:opacity-50"
                  >
                    投稿を復元する
                  </button>
                )}
                {flag.answer?.isHidden && (
                  <button
                    type="button"
                    disabled={restoreAnswerMutation.isPending}
                    onClick={() => flag.answer && restoreAnswerMutation.mutate(flag.answer.id)}
                    className="text-xs px-3 py-1.5 rounded-md border text-muted-foreground disabled:opacity-50"
                  >
                    回答を復元する
                  </button>
                )}
                {flag.post && (
                  <DeletePostButton
                    postId={flag.post.id}
                    postTitle={flag.post.title}
                    onDeleted={handleDeleted}
                  />
                )}
                <button
                  type="button"
                  disabled={flag.status === 'CONFIRMED' || confirmMutation.isPending}
                  onClick={() => handleConfirm(flag.id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border text-muted-foreground disabled:opacity-50"
                >
                  {flag.status === 'CONFIRMED' ? '確認済み' : '確認済みにする'}
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
