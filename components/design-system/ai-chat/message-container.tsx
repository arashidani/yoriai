import Image from 'next/image'

import mascotAiAvatarImage from '@/assets/mascots/mascot_ai_avatar.svg'
import { Message, type MessageProps } from '@/components/design-system/ai-chat/message'
import { cn } from '@/lib/utils'

type MessageContainerProps = {
  className?: string
  type?: 'ai' | 'user'
  size?: MessageProps['size']
  children: React.ReactNode
}

function MessageContainer({ className, type = 'ai', size, children }: MessageContainerProps) {
  return (
    <div
      data-slot="message-container"
      className={cn('flex w-fit max-w-full items-start gap-4', className)}
    >
      {/* NOTE: Figma では AI のときだけアイコンが付く（user はふきだしのみ）。
          左右の寄せは Figma のバリアントに含まれないため、呼び出し側で指定する */}
      {type === 'ai' && (
        <Image src={mascotAiAvatarImage} alt="" className="size-[57px] shrink-0" priority />
      )}
      <Message type={type} size={size}>
        {children}
      </Message>
    </div>
  )
}

export { MessageContainer }
