'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { MarkdownBody } from '@/components/mentions/markdown-body'
import { DeletePostButton } from '@/components/posts/delete-post-button'
import { formatDateTimeJst } from '@/lib/date-time'
import { client } from '@/lib/hono/client'

const SEVERITY_LABELS: Record<string, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' }
const SEVERITY_STYLES: Record<string, string> = {
  HIGH: 'bg-destructive/10 text-destructive',
  MEDIUM: 'bg-primary/10 text-primary',
  LOW: 'bg-muted text-muted-foreground',
}

type AdminPostViewerProps = {
  postId: string
}

async function fetchAdminPost(postId: string) {
  const res = await client.api.admin.posts[':id'].$get({ param: { id: postId } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch post')
  return res.json()
}

function VisibilityBadge({ hidden }: { hidden: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
        hidden ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
      }`}
    >
      {hidden ? '非表示' : '公開中'}
    </span>
  )
}

export function AdminPostViewer({ postId }: AdminPostViewerProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminPost', postId],
    queryFn: () => fetchAdminPost(postId),
  })

  useEffect(() => {
    if (!data) return
    const hash = window.location.hash
    if (!hash.startsWith('#answer-')) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [data])

  const restorePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.admin.posts[':id'].restore.$patch({ param: { id } })
      if (!res.ok) throw new Error('Failed to restore post')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPost', postId] })
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
      queryClient.invalidateQueries({ queryKey: ['adminPost', postId] })
      queryClient.invalidateQueries({ queryKey: ['aiFlags'] })
      toast.success('回答を復元しました')
    },
    onError: () => {
      toast.error('復元に失敗しました')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">投稿の取得に失敗しました</div>
  }

  if (!data) {
    return <div className="text-sm text-muted-foreground">投稿が見つかりません</div>
  }

  const { post, answers, flags } = data
  const isHidden = Boolean(post.deletedAt)

  return (
    <div className="space-y-6 max-w-3xl">
      {isHidden && (
        <p className="text-sm rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-destructive">
          この投稿は非表示です。一般ユーザーには表示されません。
        </p>
      )}

      <section className="rounded-xl border p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <VisibilityBadge hidden={isHidden} />
              <h3 className="text-base font-medium">{post.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              投稿者: {post.author?.name ?? '不明'} ・ 投稿日: {formatDateTimeJst(post.createdAt)}
              {post.deletedAt ? ` ・ 非表示日時: ${formatDateTimeJst(post.deletedAt)}` : ''}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {isHidden && (
              <button
                type="button"
                disabled={restorePostMutation.isPending}
                onClick={() => restorePostMutation.mutate(post.id)}
                className="text-xs px-3 py-1.5 rounded-md border text-muted-foreground disabled:opacity-50"
              >
                投稿を復元する
              </button>
            )}
            <DeletePostButton
              postId={post.id}
              postTitle={post.title}
              onDeleted={() => router.push('/admin/ai-flags')}
            />
          </div>
        </div>
        <MarkdownBody text={post.body} />
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-medium">AI判定</h4>
        {flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">この投稿に紐づくAIフラグはありません</p>
        ) : (
          flags.map((flag) => (
            <div key={flag.id} className="rounded-xl border p-4 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{flag.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[flag.severity]}`}
                >
                  {SEVERITY_LABELS[flag.severity]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{flag.detail}</p>
              <p className="text-xs text-muted-foreground">{formatDateTimeJst(flag.createdAt)}</p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-medium">回答 ({answers.length})</h4>
        {answers.length === 0 ? (
          <p className="text-sm text-muted-foreground">回答はありません</p>
        ) : (
          answers.map((answer) => (
            <div
              key={answer.id}
              id={`answer-${answer.id}`}
              className="rounded-xl border p-4 space-y-3 scroll-mt-4"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <VisibilityBadge hidden={answer.isHidden} />
                    <span className="text-xs text-muted-foreground">
                      投稿者: {answer.author?.name ?? '不明'} ・{' '}
                      {formatDateTimeJst(answer.createdAt)}
                      {answer.hiddenAt
                        ? ` ・ 非表示日時: ${formatDateTimeJst(answer.hiddenAt)}`
                        : ''}
                    </span>
                  </div>
                  {answer.hiddenReason && (
                    <p className="text-xs text-destructive">{answer.hiddenReason}</p>
                  )}
                </div>
                {answer.isHidden && (
                  <button
                    type="button"
                    disabled={restoreAnswerMutation.isPending}
                    onClick={() => restoreAnswerMutation.mutate(answer.id)}
                    className="text-xs px-3 py-1.5 rounded-md border text-muted-foreground disabled:opacity-50"
                  >
                    回答を復元する
                  </button>
                )}
              </div>
              <MarkdownBody text={answer.body} />
            </div>
          ))
        )}
      </section>
    </div>
  )
}
