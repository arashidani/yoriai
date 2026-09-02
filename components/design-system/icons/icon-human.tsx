import type { SVGProps } from 'react'

import { cn } from '@/lib/utils'

export function IconHuman({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 18 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
      className={cn('size-5', className)}
    >
      <path
        d="M9 0C7.67392 0 6.40215 0.526784 5.46447 1.46447C4.52678 2.40215 4 3.67392 4 5C4 6.32608 4.52678 7.59785 5.46447 8.53553C6.40215 9.47322 7.67392 10 9 10C10.3261 10 11.5979 9.47322 12.5355 8.53553C13.4732 7.59785 14 6.32608 14 5C14 3.67392 13.4732 2.40215 12.5355 1.46447C11.5979 0.526784 10.3261 0 9 0ZM1 20H17C17.55 20 18 19.55 18 19V18C18 14.14 14.86 11 11 11H7C3.14 11 0 14.14 0 18V19C0 19.55 0.45 20 1 20Z"
        fill="currentColor"
      />
    </svg>
  )
}
