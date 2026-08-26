import { Loading } from '@/components/design-system/ai-chat/loading'
import { cn } from '@/lib/utils'

type MessageAreaProps = {
  className?: string
  children?: React.ReactNode
  isLoading?: boolean
  loadingText?: React.ReactNode
  /** 新着メッセージへスクロール追従させたいときに渡す */
  ref?: React.Ref<HTMLDivElement>
}

function MessageArea({
  className,
  children,
  isLoading = false,
  loadingText,
  ref,
}: MessageAreaProps) {
  return (
    <div
      ref={ref}
      data-slot="message-area"
      className={cn(
        // NOTE: Figma はスクロールバーを 6px の矩形として並べているが、
        // globals.css の scrollbar-custom（同じ Figma: unofficial/accent-3 由来）で
        // ネイティブのスクロールバーを同じ見た目にする
        'scrollbar-custom flex h-full min-h-0 flex-col items-start gap-4 overflow-y-auto pr-5',
        className,
      )}
    >
      {children}
      {isLoading && (
        <div className="flex w-full flex-col items-center">
          <Loading>{loadingText}</Loading>
        </div>
      )}
    </div>
  )
}

export type { MessageAreaProps }
export { MessageArea }
