'use client'

import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/lib/utils'

type AuthorAvatarProps = {
  src?: string
  alt?: string
  className?: string
  sizes?: string
}

function AuthorAvatar({ src, alt = '', className, sizes = '50px' }: AuthorAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src) && src !== failedSrc

  return (
    <div
      data-slot="author-avatar"
      className={cn(
        'relative size-12.5 shrink-0 overflow-hidden rounded-md bg-informative',
        className,
      )}
    >
      {src && showImage && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  )
}

export type { AuthorAvatarProps }
export { AuthorAvatar }
