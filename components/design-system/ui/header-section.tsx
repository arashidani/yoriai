import type { ReactNode } from 'react'

import { ActionButtons } from '@/components/design-system/ui/action-buttons'
import { cn } from '@/lib/utils'

type HeaderSectionProps = {
  className?: string
  title?: string
  actions?: ReactNode
  primaryLabel?: string
  onPrimaryClick?: () => void
  secondaryLabel?: string
  onSecondaryClick?: () => void
}

function HeaderSection({
  className,
  title,
  actions,
  primaryLabel,
  onPrimaryClick,
  secondaryLabel,
  onSecondaryClick,
}: HeaderSectionProps) {
  return (
    <div
      data-slot="header-section"
      className={cn('flex w-full items-center justify-between bg-card', className)}
    >
      {title && <h1 className="font-heading text-heading-1">{title}</h1>}
      {actions ?? (
        <ActionButtons
          primaryLabel={primaryLabel ?? ''}
          onPrimaryClick={onPrimaryClick}
          secondaryLabel={secondaryLabel ?? ''}
          onSecondaryClick={onSecondaryClick}
        />
      )}
    </div>
  )
}

export type { HeaderSectionProps }
export { HeaderSection }
