import { ToolChipArrowIcon } from '@/components/icons/tool-chip-arrow-icon'
import { cn } from '@/lib/utils'

const toolChipClass =
  'relative inline-flex items-center justify-center gap-2 rounded-lg bg-informative px-3 py-2 text-informative-foreground'

const arrowClassBySide = {
  top: 'top-[-4px] left-1/2 h-[5px] w-[11.5px] -translate-x-1/2 -scale-y-100',
  bottom: 'bottom-[-4px] left-1/2 h-[5px] w-[11.5px] -translate-x-1/2',
  left: 'left-[-4px] top-1/2 h-[11.5px] w-[5px] -translate-y-1/2 -rotate-90 -scale-y-100',
  right: 'right-[-4px] top-1/2 h-[11.5px] w-[5px] -translate-y-1/2 -rotate-90',
} as const

type ToolChipSide = keyof typeof arrowClassBySide

type ToolChipProps = {
  className?: string
  text: string
  side?: ToolChipSide
}

export function ToolChip({ className, text, side = 'top' }: ToolChipProps) {
  return (
    <div className={cn(toolChipClass, className)}>
      <p className="whitespace-pre-line text-caption font-bold">{text}</p>
      <span
        className={cn(
          'absolute z-10 flex items-center justify-center text-informative',
          arrowClassBySide[side],
        )}
      >
        <ToolChipArrowIcon className="size-full" />
      </span>
    </div>
  )
}
