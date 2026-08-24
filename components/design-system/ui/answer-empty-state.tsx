import {
  MascotAnswerContainer,
  type MascotAnswerVariant,
} from '@/components/design-system/ui/mascot-answer-container'
import { cn } from '@/lib/utils'

type AnswerEmptyStateProps = {
  className?: string
  variant: MascotAnswerVariant
  message: string
  title: string
}

function AnswerEmptyState({ className, variant, message, title }: AnswerEmptyStateProps) {
  return (
    <div
      data-slot="answer-empty-state"
      className={cn(
        'flex w-full flex-col items-center justify-center gap-8 bg-card py-4',
        className,
      )}
    >
      <p className="font-heading text-heading-4 text-muted-foreground">{title}</p>
      <MascotAnswerContainer variant={variant} message={message} />
    </div>
  )
}

export type { AnswerEmptyStateProps }
export { AnswerEmptyState }
