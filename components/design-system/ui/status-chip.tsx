import { cva, type VariantProps } from 'class-variance-authority'
import { CheckIcon } from 'lucide-react'

import type { QuestionStatus } from '@/app/generated/prisma/enums'
import { cn } from '@/lib/utils'

type StatusChipStatus = Extract<QuestionStatus, 'OPEN' | 'RESOLVED'>

const STATUS_LABEL: Record<StatusChipStatus, string> = {
  OPEN: '回答募集中',
  RESOLVED: '解決済み',
}

const STATUS_CLASS: Record<StatusChipStatus, string> = {
  OPEN: 'bg-brand-2 text-primary',
  RESOLVED: 'bg-statuschip-success text-statuschip-success-foreground',
}

const statusChipVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-full font-bold whitespace-nowrap',
  {
    variants: {
      size: {
        default: 'px-2 py-0.5 text-paragraph-mini',
        large: 'px-4 py-2 text-paragraph-small',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

type StatusChipProps = VariantProps<typeof statusChipVariants> & {
  className?: string
  status: StatusChipStatus
}

function StatusChip({ className, status, size = 'default' }: StatusChipProps) {
  const isLarge = size === 'large'

  return (
    <span
      data-slot="status-chip"
      className={cn(statusChipVariants({ size }), STATUS_CLASS[status], className)}
    >
      {status === 'OPEN' ? (
        <span
          aria-hidden
          className={cn('shrink-0 rounded-full bg-primary', isLarge ? 'size-3' : 'size-2')}
        />
      ) : (
        <CheckIcon aria-hidden className={cn('shrink-0', isLarge ? 'size-3.5' : 'size-2.5')} />
      )}
      {STATUS_LABEL[status]}
    </span>
  )
}

export type { StatusChipStatus }
export { StatusChip }
