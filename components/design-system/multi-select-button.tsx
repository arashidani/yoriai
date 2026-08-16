import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@/lib/utils'

type MultiSelectButtonProps = {
  text: string
  isSelected?: boolean
  onClick?: () => void
}

export function MultiSelectButton({ text, isSelected = false, onClick }: MultiSelectButtonProps) {
  return (
    <ButtonPrimitive
      type="button"
      data-slot="button"
      onClick={onClick}
      className={cn(
        'flex h-9 items-center justify-center rounded-full border px-4 py-2 transition-colors hover:opacity-80 text-label font-bold',
        isSelected
          ? ' bg-orange-100 text-primary'
          : 'border-muted-foreground bg-secondary text-muted-foreground',
      )}
    >
      {text}
    </ButtonPrimitive>
  )
}
