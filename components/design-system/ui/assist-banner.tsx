import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type AssistBannerProps = {
  className?: string
  children: ReactNode
}

function AssistBanner({ className, children }: AssistBannerProps) {
  return (
    <div
      data-slot="assist-banner"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg bg-informative-background p-3',
        className,
      )}
    >
      <Sparkles className="size-4 shrink-0 text-informative" aria-hidden />
      <p className="text-paragraph-small font-bold text-informative">{children}</p>
    </div>
  )
}

export type { AssistBannerProps }
export { AssistBanner }
