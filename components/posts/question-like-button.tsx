'use client'

import { LikeButton } from '@/components/posts/like-button'
import { client } from '@/lib/hono/client'

type QuestionLikeButtonProps = {
  postId: string
  initialLiked: boolean
  initialLikeCount: number
}

export function QuestionLikeButton({
  postId,
  initialLiked,
  initialLikeCount,
}: QuestionLikeButtonProps) {
  return (
    <LikeButton
      initialLiked={initialLiked}
      initialLikeCount={initialLikeCount}
      onToggle={async (next) => {
        const res = next
          ? await client.api.posts[':id'].likes.$post({ param: { id: postId } })
          : await client.api.posts[':id'].likes.$delete({ param: { id: postId } })
        if (!res.ok) throw new Error('いいねの処理に失敗しました')
        return res.json()
      }}
    />
  )
}
