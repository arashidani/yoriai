'use client'

import { toast } from 'sonner'
import { AnswerItem } from '@/components/design-system/ui/answer-item'
import { useDebouncedOptimisticToggle } from '@/hooks/use-debounced-optimistic-toggle'
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

function QaAnswerRow({ answer }: { answer: QaAnswerListItem }) {
  const like = useDebouncedOptimisticToggle({
    initialPressed: answer.liked,
    initialCount: answer.likeCount,
    enabled: !answer.isOwnAnswer,
    onSync: async (pressed) => {
      const response = pressed
        ? await client.api.answers[':id'].likes.$post({ param: { id: answer.id } })
        : await client.api.answers[':id'].likes.$delete({ param: { id: answer.id } })
      if (!response.ok) throw new Error('いいねの処理に失敗しました')
      return response.json()
    },
    parseResult: (result) => ({ pressed: result.liked, count: result.likeCount }),
    onError: () => toast.error('いいねの処理に失敗しました'),
  })

  return (
    <AnswerItem
      className="py-4"
      avatarSrc={answer.displayAuthor.avatarUrl ?? undefined}
      avatarAlt=""
      authorName={answer.displayAuthor.displayName}
      timestamp={new Date(answer.createdAt).toLocaleDateString('ja-JP')}
      body={answer.body}
      likeCount={like.count ?? answer.likeCount}
      liked={like.pressed}
      canLike={!answer.isOwnAnswer}
      isMostLiked={answer.isMostLiked}
      onLikedChange={like.setPressed}
    />
  )
}

export function QaAnswerItemList({ answers }: QaAnswerItemListProps) {
  return (
    <div data-slot="answer-item-list" className="flex w-full flex-col divide-y divide-border">
      {answers.map((answer) => (
        <QaAnswerRow key={answer.id} answer={answer} />
      ))}
    </div>
  )
}
