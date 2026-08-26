import type { ComponentProps } from 'react'

import {
  ChatTextarea,
  type ChatTextareaProps,
} from '@/components/design-system/ai-chat/chat-textarea'
import { SendButton } from '@/components/design-system/ai-chat/send-button'
import { cn } from '@/lib/utils'

type InputAreaProps = {
  className?: string
  textareaProps?: ChatTextareaProps
  sendButtonProps?: ComponentProps<typeof SendButton>
}

function InputArea({ className, textareaProps, sendButtonProps }: InputAreaProps) {
  return (
    <div data-slot="input-area" className={cn('flex w-full items-center gap-4', className)}>
      <ChatTextarea {...textareaProps} className={cn('min-w-0 flex-1', textareaProps?.className)} />
      <SendButton {...sendButtonProps} className={cn('shrink-0', sendButtonProps?.className)} />
    </div>
  )
}

export type { InputAreaProps }
export { InputArea }
