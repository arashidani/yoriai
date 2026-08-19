'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { AshiatoIcon } from '@/components/icons/ashiato-icon'
import { cn } from '@/lib/utils'

const likeButtonVariants = cva(
  'group inline-flex items-center justify-center gap-1 rounded-full font-bold whitespace-nowrap text-muted-foreground outline-none aria-pressed:text-rose-400 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'text-paragraph-small',
        large: 'text-paragraph',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

type LikeButtonProps = TogglePrimitive.Props &
  VariantProps<typeof likeButtonVariants> & {
    count: number
  }

function LikeButton({ className, size = 'default', count, ...props }: LikeButtonProps) {
  return (
    <TogglePrimitive
      data-slot="like-button"
      className={cn(likeButtonVariants({ size }), className)}
      {...props}
    >
      <AshiatoIcon
        aria-hidden
        className={cn('shrink-0', size === 'large' ? 'h-[18px] w-[22px]' : 'h-[14px] w-[17px]')}
      />
      {count}
    </TogglePrimitive>
  )
}

export { LikeButton }
