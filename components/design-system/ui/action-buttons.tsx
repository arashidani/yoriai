import Link from 'next/link'
import type { ReactNode } from 'react'

import { Button } from '@/components/design-system/button'
import { IconPencil } from '@/components/design-system/icons/icon-pencil'
import { cn } from '@/lib/utils'

type ActionButtonsProps = {
  className?: string
  primaryLabel?: string
  onPrimaryClick?: () => void
  primaryAction?: ReactNode
  secondaryLabel: string
  onSecondaryClick?: () => void
  secondaryHref?: string
}

function ActionButtons({
  className,
  primaryLabel,
  onPrimaryClick,
  primaryAction,
  secondaryLabel,
  onSecondaryClick,
  secondaryHref,
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
          leftIcon={<IconPencil className="size-full" />}
          onClick={onPrimaryClick}
        >
          {primaryLabel}
        </Button>
      )}
      {secondaryHref ? (
        <Button
          size="large"
          variant="secondary"
          className="shrink-0"
          render={<Link href={secondaryHref} />}
          nativeButton={false}
        >
          {secondaryLabel}
        </Button>
      ) : (
        <Button
          type="button"
          size="large"
          variant="secondary"
          className="shrink-0"
          onClick={onSecondaryClick}
        >
          {secondaryLabel}
        </Button>
      )}
    </div>
  )
}

export type { ActionButtonsProps }
export { ActionButtons }
