'use client'

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type FilterChipProps = TogglePrimitive.Props

function FilterChip({ className, children, ...props }: FilterChipProps) {
  return (
    <TogglePrimitive
      data-slot="filter-chip"
      className={cn(
        'group inline-flex items-center justify-center gap-1 rounded-full border border-muted-foreground bg-card px-4 py-2 text-paragraph-small font-bold whitespace-nowrap text-muted-foreground outline-none transition-colors not-aria-pressed:hover:bg-statuschip-success aria-pressed:border-transparent aria-pressed:bg-brand-2 aria-pressed:text-primary',
        className,
      )}
      {...props}
    >
      <CheckIcon className="hidden size-3.5 group-aria-pressed:block" />
      {children}
    </TogglePrimitive>
  )
}

export { FilterChip }
