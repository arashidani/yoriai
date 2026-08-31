'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'

import { IconCheck } from '@/components/design-system/icons/icon-check'
import { IconHuman } from '@/components/design-system/icons/icon-human'
import { cn } from '@/lib/utils'

type JoinButtonProps = TogglePrimitive.Props

function JoinButton({ className, ...props }: JoinButtonProps) {
  return (
    <TogglePrimitive
      data-slot="join-button"
      className={cn(
        'group inline-flex w-[131px] cursor-pointer items-center justify-center gap-1 rounded-full border-2 border-primary bg-card px-6 py-4 text-paragraph font-bold whitespace-nowrap text-primary outline-none transition-colors not-aria-pressed:hover:bg-brand-2 aria-pressed:border-transparent aria-pressed:bg-brand-2 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      <IconHuman
        aria-hidden
        className="h-[15.93px] w-[14.33px] shrink-0 group-aria-pressed:hidden"
      />
      <IconCheck
        aria-hidden
        className="hidden h-[10.75px] w-[14.33px] shrink-0 group-aria-pressed:block"
      />
      <span className="group-aria-pressed:hidden">参加する</span>
      <span className="hidden group-aria-pressed:inline">参加中</span>
    </TogglePrimitive>
  )
}

export { JoinButton }
