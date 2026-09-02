import Image, { type ImageProps } from 'next/image'

import reloadIcon from '@/assets/icon-reload.svg'
import { cn } from '@/lib/utils'

type IconRefreshProps = Omit<ImageProps, 'src' | 'alt'> & {
  /** 代替テキスト。装飾目的なら空文字（既定）。 */
  alt?: string
}

export function IconRefresh({ className, alt = '', ...props }: IconRefreshProps) {
  return <Image src={reloadIcon} alt={alt} {...props} className={cn('size-4', className)} />
}
