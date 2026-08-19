'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'

import { cn } from '@/lib/utils'

const tabButtonClassName =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-t-lg bg-transparent px-6 py-4 text-paragraph font-bold whitespace-nowrap text-neutral-800 outline-none transition-colors hover:bg-muted aria-pressed:bg-muted data-[active]:bg-muted'

type TabButtonProps = TogglePrimitive.Props & {
  icon?: React.ReactNode
}

function TabButton({ className, icon, children, ...props }: TabButtonProps) {
  return (
    <TogglePrimitive
      data-slot="tab-button"
      className={cn(tabButtonClassName, className)}
      {...props}
    >
      {icon && <span className="size-4 shrink-0 overflow-clip">{icon}</span>}
      {children}
    </TogglePrimitive>
  )
}

export { TabButton, tabButtonClassName }
