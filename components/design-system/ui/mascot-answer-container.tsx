import Image from 'next/image'

import mascotShikushikuImage from '@/assets/mascots/mascot_shikushiku.svg'
import mascotXxImage from '@/assets/mascots/mascot_xx.svg'
import { ToolChip } from '@/components/design-system/ui/tool-chip'
import { cn } from '@/lib/utils'

const MASCOT_ANSWER = {
  shikushiku: { image: mascotShikushikuImage, imageClass: 'h-[102px] w-[120px]' },
  xx: { image: mascotXxImage, imageClass: 'h-[118px] w-[111px]' },
} as const

type MascotAnswerVariant = keyof typeof MASCOT_ANSWER

type MascotAnswerContainerProps = {
  className?: string
  variant: MascotAnswerVariant
  message: string
}

function MascotAnswerContainer({ className, variant, message }: MascotAnswerContainerProps) {
  const { image, imageClass } = MASCOT_ANSWER[variant]

  return (
    <div data-slot="mascot-answer-container" className={cn('flex items-start gap-2', className)}>
      {/* message に改行を含めた場合はデザイン通りに複数行で表示する */}
      <ToolChip side="right" text={message} />
      <Image src={image} alt="" className={imageClass} priority />
    </div>
  )
}

export type { MascotAnswerContainerProps, MascotAnswerVariant }
export { MascotAnswerContainer }
