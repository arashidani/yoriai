import { QuestionItem, type QuestionItemProps } from '@/components/design-system/ui/question-item'
import { cn } from '@/lib/utils'

type QuestionItemData = Omit<QuestionItemProps, 'className'> & { id: string }

type QuestionItemListProps = {
  className?: string
  items: QuestionItemData[]
}

function QuestionItemList({ className, items }: QuestionItemListProps) {
  return (
    <div
      data-slot="question-item-list"
      className={cn('flex w-full flex-col divide-y divide-border', className)}
    >
      {items.map(({ id, ...item }) => (
        <QuestionItem key={id} {...item} />
      ))}
    </div>
  )
}

export type { QuestionItemData }
export { QuestionItemList }
