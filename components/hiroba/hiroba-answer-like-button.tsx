'use client'

import { LikeButton } from '@/components/posts/like-button'
import { client } from '@/lib/hono/client'

type HirobaAnswerLikeButtonProps = {
  answerId: string
  initialLiked: boolean
  initialLikeCount: number
}

export function HirobaAnswerLikeButton({
  answerId,
  initialLiked,
  initialLikeCount,
}: HirobaAnswerLikeButtonProps) {
  return (
    <LikeButton
      initialLiked={initialLiked}
      initialLikeCount={initialLikeCount}
      onToggle={async (next) => {
        const res = next
          ? await client.api['hiroba-answers'][':id'].likes.$post({ param: { id: answerId } })
          : await client.api['hiroba-answers'][':id'].likes.$delete({ param: { id: answerId } })
        if (!res.ok) throw new Error('いいねの処理に失敗しました')
        return res.json()
      }}
    />
  )
}
