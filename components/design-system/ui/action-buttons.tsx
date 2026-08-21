import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/design-system/button'
import { cn } from '@/lib/utils'

type ActionButtonsProps = {
  className?: string
  primaryLabel?: string
  onPrimaryClick?: () => void
  primaryAction?: ReactNode
  secondaryLabel: string
  onSecondaryClick?: () => void
}

function ActionButtons({
  className,
  primaryLabel,
  onPrimaryClick,
  primaryAction,
  secondaryLabel,
  onSecondaryClick,
}: ActionButtonsProps) {
  return (
    <div
      data-slot="action-buttons"
      className={cn('flex shrink-0 flex-row flex-nowrap items-center gap-4', className)}
    >
      {primaryAction ?? (
        <Button
          type="button"
          size="large"
          variant="primary"
          className="shrink-0"
          leftIcon={<Pencil />}
          onClick={onPrimaryClick}
        >
          {primaryLabel}
        </Button>
      )}
      <Button
        type="button"
        size="large"
        variant="secondary"
        className="shrink-0"
        onClick={onSecondaryClick}
      >
        {secondaryLabel}
      </Button>
    </div>
  )
}

export type { ActionButtonsProps }
export { ActionButtons }
