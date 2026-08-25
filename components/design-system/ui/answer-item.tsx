import type { ComponentProps } from 'react'

import { AuthorAvatar } from '@/components/design-system/ui/author-avatar'
import { BestAnswerBadge } from '@/components/design-system/ui/best-answer-badge'
import { LikeButton } from '@/components/design-system/ui/like-button'
import { TenureChip } from '@/components/design-system/ui/tenure-chip'
import { cn } from '@/lib/utils'

type AnswerItemProps = {
  className?: string
  avatarSrc?: string
  avatarAlt?: string
  authorName: string
  tenure?: string
  timestamp: string
  body: string
  likeCount: number
  liked?: boolean
  canLike?: boolean
  isMostLiked?: boolean
  onLikedChange?: ComponentProps<typeof LikeButton>['onPressedChange']
}

function AnswerItem({
  className,
  avatarSrc,
  avatarAlt = '',
  authorName,
  tenure,
  timestamp,
  body,
  likeCount,
  liked,
  canLike = true,
  isMostLiked = false,
  onLikedChange,
}: AnswerItemProps) {
  return (
    <div data-slot="answer-item" className={cn('relative flex w-full flex-col gap-4', className)}>
      {isMostLiked && <BestAnswerBadge className="absolute top-0 right-0 w-[54px]" />}
      <div className="flex w-full items-start gap-4">
        <AuthorAvatar src={avatarSrc} alt={avatarAlt} className="size-10" sizes="40px" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-paragraph-small font-medium text-foreground">{authorName}</span>
              {tenure && <TenureChip>{tenure}</TenureChip>}
              <span className="text-paragraph-mini text-muted-foreground">{timestamp}</span>
            </div>
            <p className="w-full whitespace-pre-line text-paragraph text-foreground">{body}</p>
          </div>
          {canLike && (
            <div className="flex w-full items-center gap-4">
              <LikeButton
                count={likeCount}
                size="large"
                pressed={liked}
                onPressedChange={onLikedChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export type { AnswerItemProps }
export { AnswerItem }
