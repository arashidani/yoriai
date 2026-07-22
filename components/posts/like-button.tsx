'use client'

import { Heart } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (pending) return
    const next = !liked
    setPending(true)
    setLiked(next)
    setLikeCount((count) => count + (next ? 1 : -1))

    try {
      const result = await onToggle(next)
      setLiked(result.liked)
      setLikeCount(result.likeCount)
    } catch {
      setLiked(!next)
      setLikeCount((count) => count + (next ? -1 : 1))
      toast.error('いいねの処理に失敗しました')
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      className={cn(
        'gap-1.5 rounded-full border border-input px-3 text-paragraph-mini font-medium',
        liked && 'border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20',
      )}
    >
      <Heart className={cn('size-3.5', liked && 'fill-current')} />
      {likeCount}
    </Button>
  )
}
