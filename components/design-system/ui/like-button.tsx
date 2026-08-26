'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import Image from 'next/image'
import { useState } from 'react'

import pawDisabled from '@/assets/icon-paw-disabled.png'
import { IconPaw } from '@/components/design-system/icons/icon-paw'
import { IconPawOutline } from '@/components/design-system/icons/icon-paw-outline'
import { cn } from '@/lib/utils'

const likeButtonVariants = cva(
  'group inline-flex cursor-pointer items-center justify-center gap-1 rounded-full font-bold whitespace-nowrap outline-none disabled:pointer-events-none',
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
  onPressedChange,
  disabled,
  ...props
}: LikeButtonProps) {
  const iconClassName = cn('shrink-0', size === 'large' ? 'h-[18px] w-[22px]' : 'h-[14px] w-[17px]')
  const [isBouncing, setIsBouncing] = useState(false)

  function handlePressedChange(
    pressed: boolean,
    eventDetails: Parameters<NonNullable<typeof onPressedChange>>[1],
  ) {
    if (pressed) setIsBouncing(true)
    onPressedChange?.(pressed, eventDetails)
  }

  return (
    <TogglePrimitive
      data-slot="like-button"
      className={cn(likeButtonVariants({ size, state }), className)}
      onPressedChange={handlePressedChange}
      disabled={disabled}
      {...props}
    >
      {disabled ? (
        <Image src={pawDisabled} alt="" aria-hidden className={iconClassName} />
      ) : state === 'muted' ? (
        <IconPaw aria-hidden className={iconClassName} />
      ) : (
        <>
          <IconPawOutline aria-hidden className={cn(iconClassName, 'group-aria-pressed:hidden')} />
          <IconPaw
            aria-hidden
            className={cn(
              iconClassName,
              'hidden group-aria-pressed:block',
              isBouncing && 'animate-paw-bounce',
            )}
            onAnimationEnd={() => setIsBouncing(false)}
          />
        </>
      )}
      {Math.max(0, count)}
    </TogglePrimitive>
  )
}

export { LikeButton }
