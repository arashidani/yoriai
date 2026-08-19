'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import { Bookmark } from 'lucide-react'

import { cn } from '@/lib/utils'

const bookmarkButtonVariants = cva(
  'group inline-flex items-center justify-center gap-1 rounded-full font-bold whitespace-nowrap text-muted-foreground outline-none aria-pressed:text-amber-400 disabled:pointer-events-none disabled:opacity-50',
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

type BookmarkButtonProps = TogglePrimitive.Props &
  VariantProps<typeof bookmarkButtonVariants> & {
    count: number
  }

function BookmarkButton({ className, size = 'default', count, ...props }: BookmarkButtonProps) {
  return (
    <TogglePrimitive
      data-slot="bookmark-button"
      className={cn(bookmarkButtonVariants({ size }), className)}
      {...props}
    >
      <Bookmark
        aria-hidden
        className={cn(
          'shrink-0 group-aria-pressed:fill-current',
          size === 'large' ? 'size-4.5' : 'size-3.5',
        )}
      />
      {count}
    </TogglePrimitive>
  )
}

export { BookmarkButton }
