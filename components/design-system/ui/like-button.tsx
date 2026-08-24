'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { IconPaw } from '@/components/design-system/icons/icon-paw'
import { IconPawOutline } from '@/components/design-system/icons/icon-paw-outline'
import { cn } from '@/lib/utils'

const likeButtonVariants = cva(
  'group inline-flex items-center justify-center gap-1 rounded-full font-bold whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'text-paragraph-small',
        large: 'text-paragraph',
      },
      state: {
        default: 'text-muted-foreground aria-pressed:text-action-like',
        muted: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'default',
    },
  },
)

type LikeButtonProps = TogglePrimitive.Props &
  VariantProps<typeof likeButtonVariants> & {
    count: number
  }

function LikeButton({
  className,
  size = 'default',
  state = 'default',
  count,
  ...props
}: LikeButtonProps) {
  const iconClassName = cn('shrink-0', size === 'large' ? 'h-[18px] w-[22px]' : 'h-[14px] w-[17px]')

  return (
    <TogglePrimitive
      data-slot="like-button"
      className={cn(likeButtonVariants({ size, state }), className)}
      {...props}
    >
      {state === 'muted' ? (
        <IconPaw aria-hidden className={iconClassName} />
      ) : (
        <>
          <IconPawOutline aria-hidden className={cn(iconClassName, 'group-aria-pressed:hidden')} />
          <IconPaw aria-hidden className={cn(iconClassName, 'hidden group-aria-pressed:block')} />
        </>
      )}
      {Math.max(0, count)}
    </TogglePrimitive>
  )
}

export { LikeButton }
