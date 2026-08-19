import {
  MyQuestionItem,
  type MyQuestionItemProps,
} from '@/components/design-system/ui/my-question-item'
import { cn } from '@/lib/utils'

type MyQuestionItemData = Omit<MyQuestionItemProps, 'className'> & { id: string }

type MyQuestionItemListProps = {
  className?: string
  items: MyQuestionItemData[]
}

function MyQuestionItemList({ className, items }: MyQuestionItemListProps) {
  return (
    <div
      data-slot="my-question-item-list"
      className={cn('flex w-full flex-col divide-y divide-border', className)}
    >
      {items.map(({ id, ...item }) => (
        <MyQuestionItem key={id} {...item} />
      ))}
    </div>
  )
}

export type { MyQuestionItemData }
export { MyQuestionItemList }
