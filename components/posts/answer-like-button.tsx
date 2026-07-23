'use client'

import { LikeButton } from '@/components/posts/like-button'
import { client } from '@/lib/hono/client'

type AnswerLikeButtonProps = {
  answerId: string
  initialLiked: boolean
  initialLikeCount: number
}

export function AnswerLikeButton({
  answerId,
  initialLiked,
  initialLikeCount,
}: AnswerLikeButtonProps) {
  return (
    <LikeButton
      initialLiked={initialLiked}
      initialLikeCount={initialLikeCount}
      onToggle={async (next) => {
        const res = next
          ? await client.api.answers[':id'].likes.$post({ param: { id: answerId } })
          : await client.api.answers[':id'].likes.$delete({ param: { id: answerId } })
        if (!res.ok) throw new Error('いいねの処理に失敗しました')
        return res.json()
      }}
    />
  )
}
