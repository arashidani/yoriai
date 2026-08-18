import Image from 'next/image'
import type { ComponentProps } from 'react'
import { Medal } from 'lucide-react'

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
    <div data-slot="answer-item" className={cn('flex w-full flex-col gap-4', className)}>
      <div className="flex w-full items-start gap-4">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-informative">
          {avatarSrc && <Image src={avatarSrc} alt={avatarAlt} fill className="object-cover" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-paragraph-small font-medium text-foreground">{authorName}</span>
              {tenure && <TenureChip>{tenure}</TenureChip>}
              {isMostLiked && <Medal className="h-4 w-4 text-primary" aria-label="最多いいね回答" />}
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
