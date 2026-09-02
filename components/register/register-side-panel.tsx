import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RegisterSidePanelProps = {
  children: ReactNode
  className?: string
}

export function RegisterSidePanel({ children, className }: RegisterSidePanelProps) {
  return (
    <div
      className={cn(
        'w-1/2 flex flex-col items-center justify-center bg-background h-[calc(100vh-3rem)] mr-6 mt-6 mb-6 rounded-2xl',
        className,
      )}
    >
      {children}
    </div>
  )
}
