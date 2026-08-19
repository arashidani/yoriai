import Link from 'next/link'

import { CategoryChip } from '@/components/design-system/ui/category-chip'
import { CommentCount } from '@/components/design-system/ui/comment-count'
import type { StatusChipStatus } from '@/components/design-system/ui/status-chip'
import { StatusChipAction } from '@/components/design-system/ui/status-chip-action'
import { cn } from '@/lib/utils'

type MyQuestionItemProps = {
  className?: string
  href?: string
  date: string
  title: string
  category?: string
  excerpt: string
  commentCount: number
  status: StatusChipStatus
  onEndRecruiting?: () => void
}

function MyQuestionItem({
  className,
  href,
  date,
  title,
  category,
  excerpt,
  commentCount,
  status,
  onEndRecruiting,
}: MyQuestionItemProps) {
  const content = (
    <div className="flex w-full flex-col items-start gap-1">
      <p className="text-paragraph-mini font-medium text-muted-foreground">{date}</p>
      <div className="flex w-full flex-wrap items-center gap-2">
        <p className="text-paragraph font-medium text-foreground">{title}</p>
        {category && <CategoryChip>{category}</CategoryChip>}
        <CommentCount count={commentCount} />
      </div>
      <p className="w-full truncate text-paragraph-mini font-medium text-muted-foreground">
        {excerpt}
      </p>
    </div>
  )

  return (
    <div
      data-slot="my-question-item"
      className={cn('flex w-full items-center justify-between gap-4 p-6 hover:bg-muted', className)}
    >
      <div className="min-w-0 flex-1">{href ? <Link href={href}>{content}</Link> : content}</div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <StatusChipAction status={status} onEndRecruiting={onEndRecruiting} />
      </div>
    </div>
  )
}

export type { MyQuestionItemProps }
export { MyQuestionItem }
