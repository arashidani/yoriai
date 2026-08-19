import Image from 'next/image'

import mascotCloseEyeImage from '@/assets/mascots/mascot_close_eye.svg'
import mascotUruuruImage from '@/assets/mascots/mascot_uruuru.svg'
import { ToolChip } from '@/components/design-system/ui/tool-chip'
import { cn } from '@/lib/utils'

const MASCOT_IMAGE = {
  uruuru: mascotUruuruImage,
  closeEye: mascotCloseEyeImage,
} as const

type MascotVariant = keyof typeof MASCOT_IMAGE

type MascotContainerProps = {
  className?: string
  variant: MascotVariant
  message: string
}

function MascotContainer({ className, variant, message }: MascotContainerProps) {
  return (
    <div data-slot="mascot-container" className={cn('flex flex-col items-center gap-4', className)}>
      <ToolChip side="bottom" text={message} />
      <Image src={MASCOT_IMAGE[variant]} alt="" className="h-[180px] w-[164px]" priority />
    </div>
  )
}

export type { MascotVariant }
export { MascotContainer }
