'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Pagination } from '@/components/design-system/ui/pagination'
import { TUTORIAL_QA_POSTS, useFeatureTutorial } from '@/components/tutorial/feature-tutorial'
import { Spinner } from '@/components/ui/spinner'
import { client } from '@/lib/hono/client'
import { type QaPost, toQaPost } from '@/lib/questions/qa-post'
import {
  type QaFeedStatusFilter as QaFeedStatus,
  useQaFeedFilterStore,
} from '@/lib/stores/qa-feed-filter-store'
import { PostCard } from './post-card'
import { QaPostListSkeleton } from './qa-feed-list-fallback'

const PAGE_SIZE = 10
const KEYWORD_DEBOUNCE_MS = 250

type QaFeedListProps = {
  posts?: QaPost[]
  isAdmin: boolean
  initialTotalPages?: number
  initialTotal?: number
  now?: number
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
  status: QaFeedStatus
  keyword: string
  categoryIds: string[]
  tagIds: string[]
}): Promise<QuestionsResult> {
  const response = await client.api.questions.$get({
    query: {
      page: String(params.page),
      pageSize: String(PAGE_SIZE),
      status: params.status,
      keyword: params.keyword || undefined,
      categoryIds: params.categoryIds.length > 0 ? params.categoryIds.join(',') : undefined,
      tagIds: params.tagIds.length > 0 ? params.tagIds.join(',') : undefined,
    },
  })
  if (!response.ok) throw new Error('質問一覧の取得に失敗しました')
  const body = await response.json()
  return {
    posts: body.questions.map(toQaPost),
    totalPages: body.pagination.totalPages,
    total: body.pagination.total,
  }
}

type QaQuestionListProps = {
  posts: QaPost[]
  isAdmin: boolean
  now?: number
}

function QaQuestionList({ posts, isAdmin, now }: QaQuestionListProps) {
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
          now={now}
          onDeleted={(id) => setDeletedIds((prev) => [...prev, id])}
        />
      ))}
    </div>
  )
}

function QaFeedList({ posts, isAdmin, initialTotalPages = 1, initialTotal = 0 }: QaFeedListProps) {
  const { active: tutorialActive } = useFeatureTutorial()
  const keyword = useQaFeedFilterStore((state) => state.keyword)
  const status = useQaFeedFilterStore((state) => state.status)
  const selectedCategoryIds = useQaFeedFilterStore((state) => state.selectedCategoryIds)
  const selectedTagIds = useQaFeedFilterStore((state) => state.selectedTagIds)
  const page = useQaFeedFilterStore((state) => state.page)
  const setPage = useQaFeedFilterStore((state) => state.setPage)
  const listRef = useRef<HTMLDivElement>(null)
  const debouncedKeyword = useDebouncedValue(keyword, KEYWORD_DEBOUNCE_MS)
  const isDefaultQuery =
    page === 1 &&
    status === 'all' &&
    debouncedKeyword === '' &&
    selectedCategoryIds.length === 0 &&
    selectedTagIds.length === 0

  const { data, isPending, isFetching, isPlaceholderData, error } = useQuery({
    queryKey: [
      'questions',
      { page, status, keyword: debouncedKeyword, selectedCategoryIds, selectedTagIds },
    ],
    queryFn: () =>
      fetchQuestions({
        page,
        status,
        keyword: debouncedKeyword,
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
      }),
    initialData:
      posts && isDefaultQuery
        ? { posts, totalPages: initialTotalPages, total: initialTotal }
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const postsFromApi = data?.posts ?? []
  const visiblePosts = tutorialActive
    ? [...TUTORIAL_QA_POSTS, ...postsFromApi].slice(0, PAGE_SIZE)
    : postsFromApi
  const total = (data?.total ?? initialTotal) + (tutorialActive ? TUTORIAL_QA_POSTS.length : 0)
  const totalPages = Math.max(data?.totalPages ?? initialTotalPages, Math.ceil(total / PAGE_SIZE))
  const showSkeleton = isPending
  const showSpinner = isFetching && isPlaceholderData

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
    listRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  return (
    <div className="relative flex flex-1 flex-col">
      {showSpinner && (
        <div className="absolute inset-0 z-40 bg-background/70">
          <div className="sticky top-1/2 flex -translate-y-1/2 justify-center">
            <Spinner className="size-8 text-primary" aria-label="読み込み中" />
          </div>
        </div>
      )}
      <div ref={listRef} className="flex-1 scroll-mt-[17rem] px-8 py-6" aria-busy={showSpinner}>
        {error ? (
          <p role="alert" className="text-destructive">
            質問一覧の取得に失敗しました。もう一度お試しください。
          </p>
        ) : showSkeleton ? (
          <QaPostListSkeleton />
        ) : (
          <QaQuestionList posts={visiblePosts} isAdmin={isAdmin} now={now} />
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

export { QaFeedList }
