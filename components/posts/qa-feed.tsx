'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { client } from '@/lib/hono/client'
import type { Post } from './post-list'
import { PostList } from './post-list'
import { QaFeedStatusFilter } from './qa-feed-controls'
import { QaFilterBar } from './qa-filter-bar'
import { QaPagination } from './qa-pagination'

const STATUS_FILTERS = [
  { id: 'all', label: '全て' },
  { id: 'resolved', label: '解決済み' },
  { id: 'unanswered', label: '回答募集中' },
] as const

const PAGE_SIZE = 10
const KEYWORD_DEBOUNCE_MS = 250

type StatusFilter = (typeof STATUS_FILTERS)[number]['id']

type QaFeedProps = {
  posts?: Post[]
  isAdmin: boolean
  allTags: { id: string; name: string }[]
  initialTotalPages?: number
  initialTotal?: number
}

type QuestionsResult = {
  posts: Post[]
  totalPages: number
  total: number
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
  status: StatusFilter
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
  return {
    posts: body.questions.map(toPost),
    totalPages: body.pagination.totalPages,
    total: body.pagination.total,
  }
}

function QaPostListSkeleton() {
  return (
    <div className="grid gap-4" role="status" aria-label="読み込み中">
      {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
        <div
          key={key}
          className="rounded-xl border border-input bg-background p-5 shadow-xs"
          aria-hidden
        >
          <div className="flex gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-3 pl-[3.25rem]">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
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
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
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

  function resetPage(action: () => void) {
    setPage(1)
    action()
  }

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
            onKeywordChange={(value) => resetPage(() => setKeyword(value))}
            tags={allTags}
            selectedTagIds={selectedTagIds}
            onSelectedTagIdsChange={(ids) => resetPage(() => setSelectedTagIds(ids))}
          />
          <QaFeedStatusFilter
            filters={[...STATUS_FILTERS]}
            value={status}
            onValueChange={(value) => resetPage(() => setStatus(value as StatusFilter))}
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
          <PostList posts={visiblePosts} isAdmin={isAdmin} />
        )}
        <QaPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          disabled={showSpinner}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
