import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

export function IconBell({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 17.0057"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
      className={cn('size-5', className)}
    >
      <path
        d="M8 1C9.39629 1 10.7353 1.55476 11.7227 2.54199C12.7101 3.52942 13.2656 4.86919 13.2656 6.26562V9.42383C13.2659 9.71773 13.3342 10.0077 13.4658 10.2705L14.9902 13.3203H1.00977L2.53516 10.2705L2.53613 10.2695C2.66726 10.0064 2.73465 9.71585 2.73438 9.42188V6.26562C2.73438 4.86919 3.28991 3.52942 4.27734 2.54199C5.26474 1.55476 6.60371 1 8 1Z"
        stroke="currentColor"
        strokeWidth={2}
      />
      <path
        d="M5.2 15.2C5.9 15.75 6.9 16 8 16C9.1 16 10.1 15.75 10.8 15.2"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  )
}
