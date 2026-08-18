import type { ReactNode } from 'react'

import { AuthorAvatar } from '@/components/design-system/ui/author-avatar'
import { BookmarkButton } from '@/components/design-system/ui/bookmark-button'
import { CategoryChip } from '@/components/design-system/ui/category-chip'
import { CommentCount } from '@/components/design-system/ui/comment-count'
import { LikeButton } from '@/components/design-system/ui/like-button'
import { StatusChip, type StatusChipStatus } from '@/components/design-system/ui/status-chip'
import { cn } from '@/lib/utils'

type QuestionCardProps = {
  className?: string
  avatarSrc?: string
  avatarAlt?: string
  authorName: string
  date: string
  category?: string
  status: StatusChipStatus
  title: string
  body: string
  commentCount: number
  likeCount: number
  liked?: boolean
  onLikedChange?: (liked: boolean) => void
  bookmarkCount: number
  bookmarked?: boolean
  onBookmarkedChange?: (bookmarked: boolean) => void
  actions?: ReactNode
}

function QuestionCard({
  className,
  avatarSrc,
  avatarAlt = '',
  authorName,
  date,
  category,
  status,
  title,
  body,
  commentCount,
  likeCount,
  liked,
  onLikedChange,
  bookmarkCount,
  bookmarked,
  onBookmarkedChange,
  actions,
}: QuestionCardProps) {
  return (
    <div data-slot="question-card" className={cn('flex w-full flex-col gap-6', className)}>
      <div className="flex w-full items-center gap-4">
        <AuthorAvatar src={avatarSrc} alt={avatarAlt} />
        <div className="flex w-full flex-1 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-paragraph-mini text-muted-foreground">{date}</span>
            <span className="text-paragraph text-foreground">{authorName}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {category && <CategoryChip size="large">{category}</CategoryChip>}
            <StatusChip status={status} size="large" />
          </div>
        </div>
      </div>
      <p className="font-heading text-heading-1">{title}</p>
      <p className="w-full whitespace-pre-line text-paragraph text-foreground">{body}</p>
      {actions ?? (
        <div className="flex items-center gap-4">
          <CommentCount count={commentCount} size="large" />
          <LikeButton
            count={likeCount}
            size="large"
            pressed={liked}
            onPressedChange={onLikedChange}
          />
          <BookmarkButton
            count={bookmarkCount}
            size="large"
            pressed={bookmarked}
            onPressedChange={onBookmarkedChange}
          />
        </div>
      )}
    </div>
  )
}

export type { QuestionCardProps }
export { QuestionCard }
