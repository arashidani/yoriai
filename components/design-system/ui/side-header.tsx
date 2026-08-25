import { IconAi } from '@/components/design-system/icons/icon-ai'
import { cn } from '@/lib/utils'

type SideHeaderProps = {
  className?: string
  title: string
}

function SideHeader({ className, title }: SideHeaderProps) {
  return (
    <h2
      data-slot="side-header"
      className={cn(
        'flex items-center gap-2 font-heading text-heading-3 text-foreground',
        className,
      )}
    >
      <IconAi className="size-5 shrink-0 text-primary" />
      {title}
    </h2>
  )
}

export type { SideHeaderProps }
export { SideHeader }
