'use client'

import { CheckIcon } from 'lucide-react'

import type { StatusChipStatus } from '@/components/design-system/ui/status-chip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type StatusChipActionProps = {
  className?: string
  status: StatusChipStatus
  onEndRecruiting?: () => void
}

function StatusChipAction({ className, status, onEndRecruiting }: StatusChipActionProps) {
  if (status === 'RESOLVED') {
    return (
      <span
        data-slot="status-chip-action"
        className={cn(
          'inline-flex w-[132px] items-center justify-center gap-1 rounded-full bg-brand-2 px-4 py-2 text-paragraph-small font-bold text-primary',
          className,
        )}
      >
        <CheckIcon aria-hidden className="size-3.5 shrink-0" />
        解決済み
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" onClick={onEndRecruiting} />}
        data-slot="status-chip-action"
        // Base UI の既定は 600ms。取り消せない操作の注意書きなので hover 直後に出す
        delay={0}
        className={cn(
          'inline-flex items-center justify-center gap-1 rounded-full border border-primary bg-card px-4 py-2 text-paragraph-small font-bold text-primary hover:bg-brand-2',
          className,
        )}
      >
        募集を終了する
      </TooltipTrigger>
      <TooltipContent
        className="rounded-lg bg-informative px-3 py-2 text-caption font-bold text-informative-foreground"
        arrowClassName="bg-informative fill-informative"
      >
        一度終了すると元に戻せません
      </TooltipContent>
    </Tooltip>
  )
}

export { StatusChipAction }
