'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Pagination } from '@/components/design-system/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { client } from '@/lib/hono/client'
import { type QaPost, toQaPost } from '@/lib/questions/qa-post'
import { type QaFeedStatusFilter, useQaFeedFilterStore } from '@/lib/stores/qa-feed-filter-store'
import { PostCard } from './post-card'
import { QaFeedStatusFilter as QaFeedStatusFilterControl } from './qa-feed-controls'
import { QaFilterBar } from './qa-filter-bar'

const STATUS_FILTERS = [
  { id: 'all', label: '全て' },
  { id: 'unanswered', label: '回答募集中' },
  { id: 'resolved', label: '解決済み' },
] as const

const PAGE_SIZE = 10
const KEYWORD_DEBOUNCE_MS = 250

type QaFeedProps = {
  posts?: QaPost[]
  isAdmin: boolean
  allTags: { id: string; name: string }[]
  initialTotalPages?: number
  initialTotal?: number
}

type QuestionsResult = {
  posts: QaPost[]
  totalPages: number
  total: number
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])

  return debouncedValue
}

async function fetchQuestions(params: {
  page: number
  status: QaFeedStatusFilter
  keyword: string
  tagId?: string
}): Promise<QuestionsResult> {
  const response = await client.api.questions.$get({
    query: {
      page: String(params.page),
      pageSize: String(PAGE_SIZE),
      status: params.status,
      keyword: params.keyword || undefined,
      tagId: params.tagId,
    },
  })
  if (!response.ok) throw new Error('質問一覧の取得に失敗しました')
  const body = await response.json()
  const posts = body.questions.map(toQaPost)
  return {
    posts,
    totalPages: body.pagination.totalPages,
    total: body.pagination.total,
  }
}

function QaPostListSkeleton() {
  return (
    <div
      className="flex w-full flex-col divide-y divide-border"
      role="status"
      aria-label="読み込み中"
    >
      {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
        <div key={key} className="flex flex-col gap-4 p-6" aria-hidden>
          <div className="flex items-start gap-4">
            <Skeleton className="size-12.5 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

type QaQuestionListProps = {
  posts: QaPost[]
  isAdmin: boolean
}

function QaQuestionList({ posts, isAdmin }: QaQuestionListProps) {
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const visiblePosts = posts.filter((post) => !deletedIds.includes(post.id))

  if (visiblePosts.length === 0) {
    return <p className="text-secondary-foreground">まだ質問がありません。</p>
  }

  return (
    <div className="flex w-full flex-col divide-y divide-border">
      {visiblePosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isAdmin={isAdmin}
          onDeleted={(id) => setDeletedIds((prev) => [...prev, id])}
        />
      ))}
    </div>
  )
}

/** 検索・状態・単一タグ・ページをAPI Queryへ反映する質問一覧。 */
export function QaFeed({
  posts,
  isAdmin,
  allTags,
  initialTotalPages = 1,
  initialTotal = 0,
}: QaFeedProps) {
  const keyword = useQaFeedFilterStore((state) => state.keyword)
  const status = useQaFeedFilterStore((state) => state.status)
  const selectedTagIds = useQaFeedFilterStore((state) => state.selectedTagIds)
  const page = useQaFeedFilterStore((state) => state.page)
  const setKeyword = useQaFeedFilterStore((state) => state.setKeyword)
  const setStatus = useQaFeedFilterStore((state) => state.setStatus)
  const setSelectedTagIds = useQaFeedFilterStore((state) => state.setSelectedTagIds)
  const setPage = useQaFeedFilterStore((state) => state.setPage)
  const listRef = useRef<HTMLDivElement>(null)
  const debouncedKeyword = useDebouncedValue(keyword, KEYWORD_DEBOUNCE_MS)
  const tagId = selectedTagIds[0]
  const isDefaultQuery =
    page === 1 && status === 'all' && debouncedKeyword === '' && selectedTagIds.length === 0

  const { data, isPending, isFetching, isPlaceholderData, error } = useQuery({
    queryKey: ['questions', { page, status, keyword: debouncedKeyword, tagId }],
    queryFn: () =>
      fetchQuestions({
        page,
        status,
        keyword: debouncedKeyword,
        tagId,
      }),
    initialData:
      posts && isDefaultQuery
        ? { posts, totalPages: initialTotalPages, total: initialTotal }
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const visiblePosts = data?.posts ?? []
  const totalPages = data?.totalPages ?? initialTotalPages
  const total = data?.total ?? initialTotal
  const showSkeleton = isPending
  // クエリキー変更で前データを残している再取得のみ。SSR の isFetching 差による hydration mismatch を避ける
  const showSpinner = isFetching && isPlaceholderData

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
    listRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  return (
    <div className="relative flex flex-1 flex-col">
      {showSpinner && (
        <div className="absolute inset-0 z-40 bg-background/70">
          {/* リストが長くてもスピナーが視界に入るよう、ビューポート中央に留める */}
          <div className="sticky top-1/2 flex -translate-y-1/2 justify-center">
            <Spinner className="size-8 text-primary" aria-label="読み込み中" />
          </div>
        </div>
      )}
      <div className="sticky top-25 z-20 bg-background px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex flex-col gap-6">
          <QaFilterBar
            keyword={keyword}
            onKeywordChange={setKeyword}
            tags={allTags}
            selectedTagIds={selectedTagIds}
            onSelectedTagIdsChange={setSelectedTagIds}
          />
          <QaFeedStatusFilterControl
            filters={[...STATUS_FILTERS]}
            value={status}
            onValueChange={(value) => setStatus(value as QaFeedStatusFilter)}
          />
        </div>
      </div>
      <div ref={listRef} className="flex-1 scroll-mt-[17rem] px-8 py-6" aria-busy={showSpinner}>
        {error ? (
          <p role="alert" className="text-destructive">
            質問一覧の取得に失敗しました。もう一度お試しください。
          </p>
        ) : showSkeleton ? (
          <QaPostListSkeleton />
        ) : (
          <QaQuestionList posts={visiblePosts} isAdmin={isAdmin} />
        )}
        {total >= 1 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <Pagination
              page={page}
              totalPages={totalPages}
              disabled={showSpinner}
              onPageChange={handlePageChange}
            />
            <p className="text-paragraph-small text-muted-foreground">
              {total}件中 {(page - 1) * PAGE_SIZE + 1}~{Math.min(page * PAGE_SIZE, total)}件を表示
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
