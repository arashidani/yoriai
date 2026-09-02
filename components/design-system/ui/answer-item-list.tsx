import { AnswerItem, type AnswerItemProps } from '@/components/design-system/ui/answer-item'
import { cn } from '@/lib/utils'

type AnswerItemData = Omit<AnswerItemProps, 'className'> & { id: string }

type AnswerItemListProps = {
  className?: string
  items: AnswerItemData[]
}

function AnswerItemList({ className, items }: AnswerItemListProps) {
  return (
    <div
      data-slot="answer-item-list"
      className={cn('flex w-full flex-col divide-y divide-border', className)}
    >
      {items.map(({ id, ...item }) => (
        <AnswerItem key={id} className="py-4" {...item} />
      ))}
    </div>
  )
}

export type { AnswerItemData }
export { AnswerItemList }
