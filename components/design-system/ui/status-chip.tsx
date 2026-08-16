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
  RESOLVED: 'bg-muted text-muted-foreground',
}

type StatusChipProps = {
  className?: string
  status: StatusChipStatus
}

function StatusChip({ className, status }: StatusChipProps) {
  return (
    <span
      data-slot="status-chip"
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-full px-2 py-0.5 text-paragraph-mini font-bold whitespace-nowrap',
        STATUS_CLASS[status],
        className,
      )}
    >
      {status === 'OPEN' ? (
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
      ) : (
        <CheckIcon aria-hidden className="size-2.5 shrink-0" />
      )}
      {STATUS_LABEL[status]}
    </span>
  )
}

export { StatusChip }
