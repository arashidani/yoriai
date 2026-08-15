'use client'

import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { client } from '@/lib/hono/client'
import type { Post } from './post-list'
import { PostList } from './post-list'
import { QaFeedStatusFilter, QaFeedTagFilter } from './qa-feed-controls'

const STATUS_FILTERS = [
  { id: 'all', label: 'すべて' },
  { id: 'resolved', label: '解決済み' },
  { id: 'unanswered', label: '回答募集中' },
]

type QaFeedProps = {
  posts: Post[]
  isAdmin: boolean
  allTags: { id: string; name: string }[]
  initialTotalPages?: number
}

function toPost(question: {
  id: string
  title: string
  body: string
  displayAuthor: { displayName: string }
  isOwnQuestion: boolean
  likeCount: number
  liked: boolean
  saved: boolean
  status: 'OPEN' | 'RESOLVED'
  answerCount: number
  tag: { id: string; name: string } | null
  createdAt: Date | string
}): Post {
  return {
    id: question.id,
    title: question.title,
    body: question.body,
    displayName: question.displayAuthor.displayName,
    isOwnQuestion: question.isOwnQuestion,
    likeCount: question.likeCount,
    liked: question.liked,
    saved: question.saved,
    status: question.status,
    answerCount: question.answerCount,
    tags: question.tag ? [question.tag] : [],
    createdAt: question.createdAt,
  }
}

/** 検索・状態・単一タグ・ページをAPI Queryへ反映する質問一覧。 */
export function QaFeed({ posts, isAdmin, allTags, initialTotalPages = 1 }: QaFeedProps) {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [visiblePosts, setVisiblePosts] = useState(posts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latestRequestId = useRef(0)

  useEffect(() => {
    const requestId = ++latestRequestId.current
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await client.api.questions.$get({
          query: {
            page: String(page),
            pageSize: '10',
            status: status as 'all' | 'unanswered' | 'resolved',
            keyword: keyword || undefined,
            tagId: selectedTagIds[0],
          },
        })
        if (!response.ok) throw new Error('質問一覧の取得に失敗しました')
        const body = await response.json()
        if (requestId !== latestRequestId.current) return
        setVisiblePosts(body.questions.map(toPost))
        setTotalPages(body.pagination.totalPages)
      } catch {
        if (requestId !== latestRequestId.current) return
        setError('質問一覧の取得に失敗しました。もう一度お試しください。')
      } finally {
        if (requestId === latestRequestId.current) setLoading(false)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [keyword, page, selectedTagIds, status])

  function resetPage(action: () => void) {
    setPage(1)
    action()
  }

  return (
    <>
      <div className="sticky top-25 z-20 border-b border-input bg-background px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => resetPage(() => setKeyword(event.target.value))}
              placeholder="キーワードを入力"
              aria-label="キーワード検索"
              className="h-10 bg-background pl-9"
            />
          </div>
          <QaFeedTagFilter
            tags={allTags}
            selectedTagIds={selectedTagIds}
            onChange={(ids) => resetPage(() => setSelectedTagIds(ids.slice(-1)))}
          />
          <QaFeedStatusFilter
            filters={STATUS_FILTERS}
            value={status}
            onValueChange={(value) => resetPage(() => setStatus(value))}
          />
        </div>
      </div>
      <div className="flex-1 px-8 py-6" aria-busy={loading}>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : (
          <PostList posts={visiblePosts} isAdmin={isAdmin} />
        )}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
            >
              前へ
            </Button>
            <span className="text-paragraph-small">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              次へ
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
