'use client'

import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { BookmarkButton } from '@/components/design-system/ui/bookmark-button'
import { CommentCount } from '@/components/design-system/ui/comment-count'
import { LikeButton } from '@/components/design-system/ui/like-button'
import { useDebouncedOptimisticToggle } from '@/hooks/use-debounced-optimistic-toggle'
import { client } from '@/lib/hono/client'
import type { QaPost } from '@/lib/questions/qa-post'
import {
  getQuestionInteractionFromCache,
  patchQuestionInteractionCache,
  type QuestionInteractionPatch,
} from '@/lib/questions/question-interaction-cache'

type QuestionsCache = {
  posts: QaPost[]
  totalPages: number
  total: number
}

function patchQuestionsCache(
  queryClient: QueryClient,
  postId: string,
  patch: QuestionInteractionPatch,
) {
  patchQuestionInteractionCache(queryClient, postId, patch)
  queryClient.setQueriesData({ queryKey: ['questions'] }, (data) => {
    if (!data || typeof data !== 'object' || !('posts' in data)) return data
    const current = data as QuestionsCache
    if (!Array.isArray(current.posts)) return data
    return {
      ...current,
      posts: current.posts.map((post) => (post.id === postId ? { ...post, ...patch } : post)),
    }
  })
}

type QuestionItemActionsProps = {
  postId?: string
  commentCount: number
  likeCount: number
  liked?: boolean
  bookmarkCount: number
  bookmarked?: boolean
  isOwnQuestion?: boolean
  size?: 'default' | 'large'
}

function QuestionItemActions({
  postId,
  commentCount,
  likeCount: initialLikeCount,
  liked: initialLiked = false,
  bookmarkCount: initialBookmarkCount,
  bookmarked: initialBookmarked = false,
  isOwnQuestion = false,
  size = 'default',
}: QuestionItemActionsProps) {
  const queryClient = useQueryClient()
  const cachedInteraction = postId
    ? getQuestionInteractionFromCache(queryClient, postId)
    : undefined
  const resolvedLiked = cachedInteraction?.liked ?? initialLiked
  const resolvedLikeCount = cachedInteraction?.likeCount ?? initialLikeCount
  const resolvedBookmarked = cachedInteraction?.saved ?? initialBookmarked
  const resolvedBookmarkCount = cachedInteraction?.bookmarkCount ?? initialBookmarkCount

  const like = useDebouncedOptimisticToggle({
    initialPressed: resolvedLiked,
    initialCount: resolvedLikeCount,
    resetKey: postId,
    enabled: !!postId,
    onSync: async (pressed) => {
      if (!postId) throw new Error('postId is required')
      const res = pressed
        ? await client.api.questions[':id'].likes.$post({ param: { id: postId } })
        : await client.api.questions[':id'].likes.$delete({ param: { id: postId } })
      if (!res.ok) throw new Error('いいねの処理に失敗しました')
      const json = await res.json()
      patchQuestionsCache(queryClient, postId, { liked: json.liked, likeCount: json.likeCount })
      return json
    },
    parseResult: (result) => ({ pressed: result.liked, count: result.likeCount }),
    onError: () => toast.error('いいねの処理に失敗しました'),
  })

  const bookmark = useDebouncedOptimisticToggle({
    initialPressed: resolvedBookmarked,
    initialCount: resolvedBookmarkCount,
    resetKey: postId,
    enabled: !!postId,
    onSync: async (pressed) => {
      if (!postId) throw new Error('postId is required')
      const res = pressed
        ? await client.api.questions[':id'].bookmarks.$post({ param: { id: postId } })
        : await client.api.questions[':id'].bookmarks.$delete({ param: { id: postId } })
      if (!res.ok) throw new Error('保存の処理に失敗しました')
      const json = await res.json()
      patchQuestionsCache(queryClient, postId, {
        saved: json.saved,
        ...(typeof json.bookmarkCount === 'number' ? { bookmarkCount: json.bookmarkCount } : {}),
      })
      return json
    },
    parseResult: (result) => ({ pressed: result.saved, count: result.bookmarkCount }),
    onError: () => toast.error('保存の処理に失敗しました'),
  })

  function handleLikePressedChange(next: boolean) {
    if (next === like.pressed) return
    const nextCount = Math.max(0, (like.count ?? resolvedLikeCount) + (next ? 1 : -1))
    like.setPressed(next)
    if (postId) patchQuestionsCache(queryClient, postId, { liked: next, likeCount: nextCount })
  }

  function handleBookmarkPressedChange(next: boolean) {
    if (next === bookmark.pressed) return
    const nextCount = Math.max(0, (bookmark.count ?? resolvedBookmarkCount) + (next ? 1 : -1))
    bookmark.setPressed(next)
    if (postId) {
      patchQuestionsCache(queryClient, postId, { saved: next, bookmarkCount: nextCount })
    }
  }

  return (
    <div className="flex w-full items-center gap-4">
      <CommentCount count={commentCount} size={size} />
      {!isOwnQuestion && (
        <LikeButton
          count={like.count ?? resolvedLikeCount}
          size={size}
          pressed={like.pressed}
          onPressedChange={handleLikePressedChange}
        />
      )}
      <BookmarkButton
        count={bookmark.count ?? resolvedBookmarkCount}
        size={size}
        pressed={bookmark.pressed}
        onPressedChange={handleBookmarkPressedChange}
      />
    </div>
  )
}

export { QuestionItemActions }
