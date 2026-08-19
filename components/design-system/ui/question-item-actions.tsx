'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { BookmarkButton } from '@/components/design-system/ui/bookmark-button'
import { CommentCount } from '@/components/design-system/ui/comment-count'
import { LikeButton } from '@/components/design-system/ui/like-button'
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
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount)
  const [likePending, setLikePending] = useState(false)
  const [bookmarkPending, setBookmarkPending] = useState(false)

  async function handleLikedChange(pressed: boolean) {
    if (isOwnQuestion || likePending) return

    const prevLiked = liked
    const prevCount = likeCount
    setLiked(pressed)
    setLikeCount((count) => count + (pressed ? 1 : -1))

    if (!postId) return

    setLikePending(true)
    try {
      const res = pressed
        ? await client.api.questions[':id'].likes.$post({ param: { id: postId } })
        : await client.api.questions[':id'].likes.$delete({ param: { id: postId } })
      if (!res.ok) throw new Error('いいねの処理に失敗しました')
      const body = await res.json()
      setLiked(body.liked)
      setLikeCount(body.likeCount)
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
      toast.error('いいねの処理に失敗しました')
    } finally {
      setLikePending(false)
    }
  }

  async function handleBookmarkedChange(pressed: boolean) {
    if (bookmarkPending) return

    const prevBookmarked = bookmarked
    const prevCount = bookmarkCount
    setBookmarked(pressed)
    setBookmarkCount((count) => count + (pressed ? 1 : -1))

    if (!postId) return

    setBookmarkPending(true)
    try {
      const res = pressed
        ? await client.api.questions[':id'].bookmarks.$post({ param: { id: postId } })
        : await client.api.questions[':id'].bookmarks.$delete({ param: { id: postId } })
      if (!res.ok) throw new Error('保存の処理に失敗しました')
      const body = await res.json()
      setBookmarked(body.saved)
    } catch {
      setBookmarked(prevBookmarked)
      setBookmarkCount(prevCount)
      toast.error('保存の処理に失敗しました')
    } finally {
      setBookmarkPending(false)
    }
  }

  return (
    <div className="flex w-full items-center gap-4">
      <CommentCount count={commentCount} size={size} />
      {!isOwnQuestion && (
        <LikeButton
          count={likeCount}
          size={size}
          pressed={liked}
          onPressedChange={handleLikedChange}
          disabled={likePending}
        />
      )}
      <BookmarkButton
        count={bookmarkCount}
        size={size}
        pressed={bookmarked}
        onPressedChange={handleBookmarkedChange}
        disabled={bookmarkPending}
      />
    </div>
  )
}

export { QuestionItemActions }
