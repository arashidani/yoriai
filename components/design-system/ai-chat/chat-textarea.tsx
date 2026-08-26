import type { ComponentProps } from 'react'

import { Textarea } from '@/components/design-system/ui/textarea'
import { cn } from '@/lib/utils'

type ChatTextareaProps = ComponentProps<typeof Textarea>

function ChatTextarea({
  className,
  placeholder = 'よりあいぬに質問する',
  rows = 1,
  ...props
}: ChatTextareaProps) {
  return (
    <Textarea
      data-slot="chat-textarea"
      placeholder={placeholder}
      rows={rows}
      // NOTE: Figma の「Resizable」ハンドルは hidden なので resize させない
      className={cn('min-h-[50px] resize-none p-3.5', className)}
      {...props}
    />
  )
}

export type { ChatTextareaProps }
export { ChatTextarea }
