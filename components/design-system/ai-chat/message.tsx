import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const messageVariants = cva(
  'flex w-fit max-w-full items-center justify-center gap-2 rounded-lg px-4 py-3',
  {
    variants: {
      type: {
        // Figma: 発話者側の上端の角だけ落として吹き出しの向きを表す
        ai: 'rounded-tl-none bg-aichat-ai text-aichat-ai-foreground',
        user: 'rounded-tr-none bg-aichat-user text-aichat-user-foreground',
      },
    },
    defaultVariants: {
      type: 'ai',
    },
  },
)

// Figma のテキストスタイル名に対応。message コンポーネント単体の定義は body small bold だが、
// MessageArea 内のインスタンスは body bold で上書きされている
const messageTextVariants = cva('min-w-0 break-words whitespace-pre-wrap font-bold', {
  variants: {
    size: {
      bodySmall: 'text-paragraph-small',
      body: 'text-paragraph',
    },
  },
  defaultVariants: {
    size: 'bodySmall',
  },
})

type MessageProps = React.ComponentProps<'div'> &
  VariantProps<typeof messageVariants> &
  VariantProps<typeof messageTextVariants>

function Message({ className, type = 'ai', size = 'bodySmall', children, ...props }: MessageProps) {
  return (
    <div data-slot="message" className={cn(messageVariants({ type, className }))} {...props}>
      {/* NOTE: Figma は 1行のプレースホルダのため whitespace-nowrap だが、
          実運用の発話は折り返し・改行が必要なので pre-wrap + break-words にしている */}
      <p className={messageTextVariants({ size })}>{children}</p>
    </div>
  )
}

export type { MessageProps }
export { Message, messageVariants }
