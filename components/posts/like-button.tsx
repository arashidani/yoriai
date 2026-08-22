'use client'

import { toast } from 'sonner'
import { IconPaw } from '@/components/design-system/icons/icon-paw'
import { Button } from '@/components/ui/button'
import { useDebouncedOptimisticToggle } from '@/hooks/use-debounced-optimistic-toggle'
import { cn } from '@/lib/utils'

type LikeButtonProps = {
  initialLiked: boolean
  initialLikeCount: number
  onToggle: (next: boolean) => Promise<{ liked: boolean; likeCount: number }>
  size?: 'sm' | 'default'
}

export function LikeButton({
  initialLiked,
  initialLikeCount,
  onToggle,
  size = 'sm',
}: LikeButtonProps) {
  const {
    pressed: liked,
    count: likeCount,
    toggle,
  } = useDebouncedOptimisticToggle({
    initialPressed: initialLiked,
    initialCount: initialLikeCount,
    onSync: onToggle,
    parseResult: (result) => ({ pressed: result.liked, count: result.likeCount }),
    onError: () => toast.error('いいねの処理に失敗しました'),
  })

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={toggle}
      aria-pressed={liked}
      className={cn(
        'gap-1.5 rounded-full border border-input px-3 text-paragraph-mini font-medium',
        liked && 'border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20',
      )}
    >
      <IconPaw className="size-3.5" />
      {Math.max(0, likeCount ?? 0)}
    </Button>
  )
}
