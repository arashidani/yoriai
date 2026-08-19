'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  type MyQuestionItemData,
  MyQuestionItemList,
} from '@/components/design-system/ui/my-question-item-list'
import { client } from '@/lib/hono/client'

type PostedQuestionListProps = {
  items: MyQuestionItemData[]
}

function PostedQuestionList({ items }: PostedQuestionListProps) {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  async function handleEndRecruiting(id: string) {
    setResolvedIds((prev) => new Set(prev).add(id))
    try {
      const res = await client.api.questions[':id'].resolve.$post({ param: { id } })
      if (!res.ok) throw new Error('募集の終了に失敗しました')
    } catch {
      setResolvedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.error('募集の終了に失敗しました')
    }
  }

  const resolvedItems = items.map((item) => ({
    ...item,
    status: resolvedIds.has(item.id) ? ('RESOLVED' as const) : item.status,
    onEndRecruiting: () => handleEndRecruiting(item.id),
  }))

  return <MyQuestionItemList items={resolvedItems} />
}

export { PostedQuestionList }
