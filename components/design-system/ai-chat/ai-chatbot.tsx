import { Body, type BodyProps } from '@/components/design-system/ai-chat/body'
import { Header, type HeaderProps } from '@/components/design-system/ai-chat/header'
import { cn } from '@/lib/utils'

type AiChatbotProps = {
  className?: string
  children?: React.ReactNode
  headerProps?: HeaderProps
  bodyProps?: Omit<BodyProps, 'children'>
}

/**
 * ヘッダー + ボディを束ねた AI チャットボット全体。
 * 高さは呼び出し側で決める（内部が flex-1 で伸縮し、メッセージ一覧だけがスクロールする）。
 */
function AiChatbot({ className, children, headerProps, bodyProps }: AiChatbotProps) {
  return (
    <div
      data-slot="ai-chatbot"
      className={cn(
        'flex h-full w-full flex-col overflow-clip rounded-lg bg-background-subtle shadow-aichat',
        className,
      )}
    >
      <Header {...headerProps} className={cn('shrink-0', headerProps?.className)} />
      <Body {...bodyProps} className={cn('min-h-0 flex-1', bodyProps?.className)}>
        {children}
      </Body>
    </div>
  )
}

export type { AiChatbotProps }
export { AiChatbot }
