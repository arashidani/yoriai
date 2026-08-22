'use client'

import { toast } from 'sonner'

import { BookmarkButton } from '@/components/design-system/ui/bookmark-button'
import { CommentCount } from '@/components/design-system/ui/comment-count'
import { LikeButton } from '@/components/design-system/ui/like-button'
import { useDebouncedOptimisticToggle } from '@/hooks/use-debounced-optimistic-toggle'
import { client } from '@/lib/hono/client'

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
  const like = useDebouncedOptimisticToggle({
    initialPressed: initialLiked,
    initialCount: initialLikeCount,
    enabled: !!postId,
    onSync: async (pressed) => {
      if (!postId) throw new Error('postId is required')
      const res = pressed
        ? await client.api.questions[':id'].likes.$post({ param: { id: postId } })
        : await client.api.questions[':id'].likes.$delete({ param: { id: postId } })
      if (!res.ok) throw new Error('いいねの処理に失敗しました')
      return res.json()
    },
    parseResult: (result) => ({ pressed: result.liked, count: result.likeCount }),
    onError: () => toast.error('いいねの処理に失敗しました'),
  })

  const bookmark = useDebouncedOptimisticToggle({
    initialPressed: initialBookmarked,
    initialCount: initialBookmarkCount,
    enabled: !!postId,
    onSync: async (pressed) => {
      if (!postId) throw new Error('postId is required')
      const res = pressed
        ? await client.api.questions[':id'].bookmarks.$post({ param: { id: postId } })
        : await client.api.questions[':id'].bookmarks.$delete({ param: { id: postId } })
      if (!res.ok) throw new Error('保存の処理に失敗しました')
      return res.json()
    },
    parseResult: (result) => ({ pressed: result.saved }),
    onError: () => toast.error('保存の処理に失敗しました'),
  })

  return (
    <div className="flex w-full items-center gap-4">
      <CommentCount count={commentCount} size={size} />
      {!isOwnQuestion && (
        <LikeButton
          count={like.count ?? initialLikeCount}
          size={size}
          pressed={like.pressed}
          onPressedChange={like.setPressed}
        />
      )}
      <BookmarkButton
        count={bookmark.count ?? initialBookmarkCount}
        size={size}
        pressed={bookmark.pressed}
        onPressedChange={bookmark.setPressed}
      />
    </div>
  )
}

export { QuestionItemActions }
