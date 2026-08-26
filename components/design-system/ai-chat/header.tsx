import { Button as ButtonPrimitive } from '@base-ui/react/button'

import { IconAi } from '@/components/design-system/icons/icon-ai'
import { IconClose } from '@/components/design-system/icons/icon-close'
import { IconRefresh } from '@/components/design-system/icons/icon-refresh'
import { cn } from '@/lib/utils'

/** ヘッダー右側の丸アイコンボタン。地色はヘッダーと同色で、hover のときだけ濃くなる */
function HeaderIconButton({
  className,
  children,
  ...props
}: ButtonPrimitive.Props & { 'aria-label': string }) {
  return (
    <ButtonPrimitive
      className={cn(
        'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary p-2 text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

type HeaderProps = {
  className?: string
  title?: React.ReactNode
  onRefresh?: () => void
  onClose?: () => void
  refreshLabel?: string
  closeLabel?: string
}

function Header({
  className,
  title = 'よりあいぬの小屋',
  onRefresh,
  onClose,
  refreshLabel = '会話をリセット',
  closeLabel = 'チャットを閉じる',
}: HeaderProps) {
  return (
    <div
      data-slot="chat-header"
      className={cn('flex w-full items-center justify-between bg-primary p-6', className)}
    >
      <div className="flex items-center gap-2">
        <IconAi className="size-[25px] shrink-0 text-primary-foreground" />
        <p className="whitespace-nowrap text-background-2 text-heading-1">{title}</p>
      </div>
      <div className="flex items-center gap-1">
        <HeaderIconButton aria-label={refreshLabel} onClick={onRefresh}>
          <IconRefresh />
        </HeaderIconButton>
        <HeaderIconButton aria-label={closeLabel} onClick={onClose}>
          <IconClose className="size-4" />
        </HeaderIconButton>
      </div>
    </div>
  )
}

export type { HeaderProps }
export { Header }
