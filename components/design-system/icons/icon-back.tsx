import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

export function IconBack({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 13 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
      className={cn('size-5', className)}
    >
      <path
        d="M10.5603 0.356966L0.515921 8.88871C0.354104 9.02623 0.224213 9.19683 0.135161 9.38878C0.0461077 9.58074 0 9.78952 0 10.0008C0 10.2121 0.0461077 10.4209 0.135161 10.6128C0.224213 10.8048 0.354104 10.9754 0.515921 11.1129L10.5603 19.6446C11.5191 20.4589 13 19.7838 13 18.5325V1.46662C13 0.215361 11.5191 -0.459708 10.5603 0.356966Z"
        fill="currentColor"
      />
    </svg>
  )
}
