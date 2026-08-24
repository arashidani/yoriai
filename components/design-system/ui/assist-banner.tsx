import type { ReactNode } from 'react'

import { IconAi } from '@/components/design-system/icons/icon-ai'
import { IconSupport } from '@/components/design-system/icons/icon-support'
import { cn } from '@/lib/utils'

const ASSIST_BANNER_ICON = {
  ai: IconAi,
  support: IconSupport,
} as const

type AssistBannerVariant = keyof typeof ASSIST_BANNER_ICON

type AssistBannerProps = {
  className?: string
  children: ReactNode
  variant?: AssistBannerVariant
}

function AssistBanner({ className, children, variant = 'ai' }: AssistBannerProps) {
  const Icon = ASSIST_BANNER_ICON[variant]

  return (
    <div
      data-slot="assist-banner"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg bg-informative-background p-3',
        className,
      )}
    >
      <Icon className="size-4 shrink-0 text-informative" />
      <p className="text-paragraph-small font-bold text-informative">{children}</p>
    </div>
  )
}

export type { AssistBannerProps, AssistBannerVariant }
export { AssistBanner }
