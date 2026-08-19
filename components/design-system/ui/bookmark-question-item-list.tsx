import {
  BookmarkQuestionItem,
  type BookmarkQuestionItemProps,
} from '@/components/design-system/ui/bookmark-question-item'
import { cn } from '@/lib/utils'

type BookmarkQuestionItemData = Omit<BookmarkQuestionItemProps, 'className'> & { id: string }

type BookmarkQuestionItemListProps = {
  className?: string
  items: BookmarkQuestionItemData[]
}

function BookmarkQuestionItemList({ className, items }: BookmarkQuestionItemListProps) {
  return (
    <div
      data-slot="bookmark-question-item-list"
      className={cn('flex w-full flex-col divide-y divide-border', className)}
    >
      {items.map(({ id, ...item }) => (
        <BookmarkQuestionItem key={id} {...item} />
      ))}
    </div>
  )
}

export type { BookmarkQuestionItemData }
export { BookmarkQuestionItemList }
