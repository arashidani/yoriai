import { InputArea, type InputAreaProps } from '@/components/design-system/ai-chat/input-area'
import { MessageArea } from '@/components/design-system/ai-chat/message-area'
import { cn } from '@/lib/utils'

type BodyProps = {
  className?: string
  children?: React.ReactNode
  isLoading?: boolean
  loadingText?: React.ReactNode
  inputAreaProps?: InputAreaProps
  /** MessageArea のスクロール領域への ref */
  messageAreaRef?: React.Ref<HTMLDivElement>
}

function Body({
  className,
  children,
  isLoading,
  loadingText,
  inputAreaProps,
  messageAreaRef,
}: BodyProps) {
  return (
    <div
      data-slot="chat-body"
      className={cn('flex min-h-0 w-full flex-col gap-5 bg-background-subtle p-5', className)}
    >
      <MessageArea
        ref={messageAreaRef}
        className="min-h-0 flex-1"
        isLoading={isLoading}
        loadingText={loadingText}
      >
        {children}
      </MessageArea>
      <InputArea {...inputAreaProps} className={cn('shrink-0', inputAreaProps?.className)} />
    </div>
  )
}

export type { BodyProps }
export { Body }
