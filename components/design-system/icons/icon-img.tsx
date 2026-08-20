import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

export function IconImg({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
      className={cn('size-5', className)}
    >
      <path
        d="M2.22222 20H17.7778C19 20 20 19 20 17.7778V2.22222C20 1 19 0 17.7778 0H2.22222C1 0 0 1 0 2.22222V17.7778C0 19 1 20 2.22222 20ZM6.11111 4.44444C7.03333 4.44444 7.77778 5.18889 7.77778 6.11111C7.77778 7.03333 7.03333 7.77778 6.11111 7.77778C5.18889 7.77778 4.44444 7.03333 4.44444 6.11111C4.44444 5.18889 5.18889 4.44444 6.11111 4.44444ZM2.22222 16.0111L5.55556 12.6778L6.98889 14.1111C7.42222 14.5444 8.12222 14.5444 8.55556 14.1111L14.4333 8.23333L17.7667 11.5667V17.7778H2.21111V16.0111H2.22222Z"
        fill="currentColor"
      />
    </svg>
  )
}
