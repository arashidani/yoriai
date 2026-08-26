import { Button as ButtonPrimitive } from '@base-ui/react/button'

import { IconSend } from '@/components/design-system/icons/icon-send'
import { cn } from '@/lib/utils'

function SendButton({
  className,
  isDisabled = false,
  'aria-label': ariaLabel = '送信',
  children,
  ...props
}: ButtonPrimitive.Props & { isDisabled?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="send-button"
      aria-label={ariaLabel}
      disabled={isDisabled}
      className={cn(
        'flex size-[50px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground',
        className,
      )}
      {...props}
    >
      {/* Figma のアイコンスロットは 16px 固定。children で差し替えても同じ大きさに揃える */}
      <span className="flex size-4 shrink-0 items-center justify-center overflow-clip [&>svg]:size-full">
        {children ?? <IconSend />}
      </span>
    </ButtonPrimitive>
  )
}

export { SendButton }
