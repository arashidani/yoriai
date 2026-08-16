import Image from 'next/image'
import type { ComponentProps } from 'react'

import { BookmarkButton } from '@/components/design-system/ui/bookmark-button'
import { CategoryChip } from '@/components/design-system/ui/category-chip'
import { CommentCount } from '@/components/design-system/ui/comment-count'
import { LikeButton } from '@/components/design-system/ui/like-button'
import { StatusChip, type StatusChipStatus } from '@/components/design-system/ui/status-chip'
import { cn } from '@/lib/utils'

type QuestionItemProps = {
  className?: string
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
  onLikedChange?: ComponentProps<typeof LikeButton>['onPressedChange']
  bookmarkCount: number
  bookmarked?: boolean
  onBookmarkedChange?: ComponentProps<typeof BookmarkButton>['onPressedChange']
}

function QuestionItem({
  className,
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
  onLikedChange,
  bookmarkCount,
  bookmarked,
  onBookmarkedChange,
}: QuestionItemProps) {
  return (
    <div
      data-slot="question-item"
      className={cn('flex w-full flex-col gap-4 p-6 hover:bg-muted', className)}
    >
      <div className="flex w-full items-start gap-4">
        <div className="relative size-12.5 shrink-0 overflow-hidden rounded-md bg-informative">
          {avatarSrc && <Image src={avatarSrc} alt={avatarAlt} fill className="object-cover" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-paragraph-small font-medium text-foreground">{authorName}</span>
              {category && <CategoryChip>{category}</CategoryChip>}
              <StatusChip status={status} />
              <span className="text-paragraph-mini text-muted-foreground">{timestamp}</span>
            </div>
            <div className="flex w-full flex-col gap-1">
              <p className="text-paragraph text-foreground">{title}</p>
              <p className="truncate text-paragraph-mini text-muted-foreground">{excerpt}</p>
            </div>
          </div>
          <div className="flex w-full items-center gap-4">
            <CommentCount count={commentCount} />
            <LikeButton count={likeCount} pressed={liked} onPressedChange={onLikedChange} />
            <BookmarkButton
              count={bookmarkCount}
              pressed={bookmarked}
              onPressedChange={onBookmarkedChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export type { QuestionItemProps }
export { QuestionItem }
