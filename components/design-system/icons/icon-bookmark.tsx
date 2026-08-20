import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

export function IconBookmark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
      className={cn('size-5', className)}
    >
      <path
        d="M8 17.6689L3.2 19.7892C2.4381 20.1229 1.71429 20.0593 1.02857 19.5984C0.342857 19.1374 0 18.4844 0 17.6395V2.35586C0 1.708 0.224 1.15358 0.672 0.692622C1.12 0.231659 1.6579 0.000785285 2.28571 0H13.7143C14.3429 0 14.8811 0.230874 15.3291 0.692622C15.7771 1.15437 16.0008 1.70878 16 2.35586V17.6395C16 18.4837 15.6571 19.1366 14.9714 19.5984C14.2857 20.0601 13.5619 20.1237 12.8 19.7892L8 17.6689Z"
        fill="currentColor"
      />
    </svg>
  )
}
