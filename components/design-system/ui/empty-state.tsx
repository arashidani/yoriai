import { MascotContainer, type MascotVariant } from '@/components/design-system/ui/mascot-container'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  className?: string
  variant: MascotVariant
  message: string
  title: string
  description: string
}

function EmptyState({ className, variant, message, title, description }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex w-full flex-col items-center justify-center gap-12 bg-card py-24',
        className,
      )}
    >
      <MascotContainer variant={variant} message={message} />
      <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
        <p className="font-heading text-heading-4">{title}</p>
        <p className="text-paragraph-small font-medium">{description}</p>
      </div>
    </div>
  )
}

export type { EmptyStateProps }
export { EmptyState }
