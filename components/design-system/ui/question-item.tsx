import Link from 'next/link'

import { AuthorAvatar } from '@/components/design-system/ui/author-avatar'
import { CategoryChip } from '@/components/design-system/ui/category-chip'
import { QuestionItemActions } from '@/components/design-system/ui/question-item-actions'
import { StatusChip, type StatusChipStatus } from '@/components/design-system/ui/status-chip'
import { cn } from '@/lib/utils'

type QuestionItemProps = {
  className?: string
  postId?: string
  href?: string
  avatarSrc?: string
  avatarAlt?: string
  authorName: string
  category?: string
  status: StatusChipStatus
  timestamp: string
  title: string
  excerpt: string
  commentCount: number
  likeCount: number
  liked?: boolean
  bookmarkCount: number
  bookmarked?: boolean
  isOwnQuestion?: boolean
}

function QuestionItem({
  className,
  postId,
  href,
  avatarSrc,
  avatarAlt = '',
  authorName,
  category,
  status,
  timestamp,
  title,
  excerpt,
  commentCount,
  likeCount,
  liked,
  bookmarkCount,
  bookmarked,
  isOwnQuestion,
}: QuestionItemProps) {
  return (
    <div
      data-slot="question-item"
      className={cn('flex w-full flex-col gap-4 p-6 hover:bg-muted', href && 'cursor-pointer', className)}
    >
      <div className="flex w-full items-start gap-4">
        <AuthorAvatar src={avatarSrc} alt={avatarAlt} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-paragraph-small font-medium text-foreground">{authorName}</span>
              {category && <CategoryChip>{category}</CategoryChip>}
              <StatusChip status={status} />
              <span className="text-paragraph-mini text-muted-foreground">{timestamp}</span>
            </div>
            <div className="flex w-full flex-col gap-1">
              {href ? (
                <Link href={href} className="flex w-full flex-col gap-1">
                  <p className="text-paragraph text-foreground">{title}</p>
                  <p className="truncate text-paragraph-mini text-muted-foreground">{excerpt}</p>
                </Link>
              ) : (
                <>
                  <p className="text-paragraph text-foreground">{title}</p>
                  <p className="truncate text-paragraph-mini text-muted-foreground">{excerpt}</p>
                </>
              )}
            </div>
          </div>
          <QuestionItemActions
            postId={postId}
            commentCount={commentCount}
            likeCount={likeCount}
            liked={liked}
            bookmarkCount={bookmarkCount}
            bookmarked={bookmarked}
            isOwnQuestion={isOwnQuestion}
          />
        </div>
      </div>
    </div>
  )
}

export type { QuestionItemProps }
export { QuestionItem }
