'use client'

import { LikeButton } from '@/components/posts/like-button'
import { client } from '@/lib/hono/client'

type HirobaPostLikeButtonProps = {
  postId: string
  initialLiked: boolean
  initialLikeCount: number
}

export function HirobaPostLikeButton({
  postId,
  initialLiked,
  initialLikeCount,
}: HirobaPostLikeButtonProps) {
  return (
    <LikeButton
      initialLiked={initialLiked}
      initialLikeCount={initialLikeCount}
      onToggle={async (next) => {
        const res = next
          ? await client.api['hiroba-posts'][':id'].likes.$post({ param: { id: postId } })
          : await client.api['hiroba-posts'][':id'].likes.$delete({ param: { id: postId } })
        if (!res.ok) throw new Error('いいねの処理に失敗しました')
        return res.json()
      }}
    />
  )
}
