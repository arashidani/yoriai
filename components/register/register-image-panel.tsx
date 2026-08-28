import Image, { type StaticImageData } from 'next/image'
import logoFull from '@/assets/logo-full.svg'
import defaultRightImage from '@/assets/register-right.png'
import { cn } from '@/lib/utils'

type RegisterImagePanelProps = {
  image?: StaticImageData
  priority?: boolean
  className?: string
}

export function RegisterImagePanel({
  image = defaultRightImage,
  priority = false,
  className,
}: RegisterImagePanelProps) {
  return (
    <div className={cn('w-1/2', className)}>
      <header>
        <h1 className="absolute top-6 left-6 m-4 flex gap-4">
          <Image src={logoFull} alt="ロゴ" width={140} height={38} />
          <p className="font-bold">会社の「初めまして」をもっと身近に</p>
        </h1>
      </header>

      <Image
        src={image}
        priority={priority}
        width={732}
        height={900}
        alt=""
        className="w-full h-auto object-cover"
      />
    </div>
  )
}
