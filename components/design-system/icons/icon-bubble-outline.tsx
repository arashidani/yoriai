import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

export function IconBubbleOutline({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
      className={cn('size-5', className)}
    >
      <path
        d="M7.5 1C3.91024 1 1 3.91024 1 7.5C1 11.0898 3.91024 14 7.5 14H13.0957L12.4082 12.7627L12.0762 12.165L12.5117 11.6387C13.4754 10.4754 14.0019 9.01154 14 7.50098V7.5C14 3.91024 11.0898 1 7.5 1Z"
        stroke="currentColor"
        strokeWidth={2}
      />
    </svg>
  )
}
