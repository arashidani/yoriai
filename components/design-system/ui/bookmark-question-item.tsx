import Link from 'next/link'

import { CategoryChip } from '@/components/design-system/ui/category-chip'
import { CommentCount } from '@/components/design-system/ui/comment-count'
import { StatusChip, type StatusChipStatus } from '@/components/design-system/ui/status-chip'
import { cn } from '@/lib/utils'

type BookmarkQuestionItemProps = {
  className?: string
  href?: string
  date: string
  title: string
  category?: string
  status: StatusChipStatus
  excerpt: string
  commentCount: number
}

function BookmarkQuestionItem({
  className,
  href,
  date,
  title,
  category,
  status,
  excerpt,
  commentCount,
}: BookmarkQuestionItemProps) {
  const content = (
    <div className="flex w-full flex-col items-start gap-1">
      <p className="text-paragraph-mini font-medium text-muted-foreground">{date}</p>
      <div className="flex w-full flex-wrap items-center gap-2">
        <p className="text-paragraph font-medium text-foreground">{title}</p>
        {category && <CategoryChip>{category}</CategoryChip>}
        <StatusChip status={status} />
        <CommentCount count={commentCount} />
      </div>
      <p className="w-full truncate text-paragraph-mini font-medium text-muted-foreground">
        {excerpt}
      </p>
    </div>
  )

  return (
    <div
      data-slot="bookmark-question-item"
      className={cn('flex w-full items-center p-6 hover:bg-muted', className)}
    >
      {href ? (
        <Link href={href} className="w-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  )
}

export type { BookmarkQuestionItemProps }
export { BookmarkQuestionItem }
