'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AnswerItemList, type AnswerItemData } from '@/components/design-system/ui/answer-item-list'
import { client } from '@/lib/hono/client'

type QaAnswerListItem = {
  id: string
  body: string
  likeCount: number
  liked: boolean
  isOwnAnswer: boolean
  isMostLiked: boolean
  displayAuthor: {
    displayName: string
    avatarUrl: string | null
  }
  createdAt: Date | string
}

type QaAnswerItemListProps = {
  answers: QaAnswerListItem[]
}

export function QaAnswerItemList({ answers }: QaAnswerItemListProps) {
  const [items, setItems] = useState(answers)

  async function toggleLike(answerId: string, nextLiked: boolean) {
    const before = items.find((item) => item.id === answerId)
    if (!before) return

    setItems((current) =>
      current.map((item) =>
        item.id === answerId
          ? { ...item, liked: nextLiked, likeCount: item.likeCount + (nextLiked ? 1 : -1) }
          : item,
      ),
    )

    try {
      const response = nextLiked
        ? await client.api.answers[':id'].likes.$post({ param: { id: answerId } })
        : await client.api.answers[':id'].likes.$delete({ param: { id: answerId } })
      if (!response.ok) throw new Error('failed')

      const result = await response.json()
      setItems((current) =>
        current.map((item) =>
          item.id === answerId ? { ...item, liked: result.liked, likeCount: result.likeCount } : item,
        ),
      )
    } catch {
      setItems((current) =>
        current.map((item) =>
          item.id === answerId ? { ...item, liked: before.liked, likeCount: before.likeCount } : item,
        ),
      )
      toast.error('いいねの処理に失敗しました')
    }
  }

  const listItems: AnswerItemData[] = items.map((answer) => ({
    id: answer.id,
    avatarSrc: answer.displayAuthor.avatarUrl ?? undefined,
    avatarAlt: '',
    authorName: answer.displayAuthor.displayName,
    timestamp: new Date(answer.createdAt).toLocaleDateString('ja-JP'),
    body: answer.body,
    likeCount: answer.likeCount,
    liked: answer.liked,
    canLike: !answer.isOwnAnswer,
    isMostLiked: answer.isMostLiked,
    onLikedChange: (nextLiked) => toggleLike(answer.id, nextLiked),
  }))

  return <AnswerItemList items={listItems} />
}
