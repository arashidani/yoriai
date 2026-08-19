import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const textareaVariants = cva(
  'w-full min-h-19 border-2 border-input bg-card p-3 text-paragraph-small font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border focus-visible:border-border-4 focus-visible:ring-3 focus-visible:ring-ring aria-invalid:border aria-invalid:border-destructive-border aria-invalid:ring-3 aria-invalid:ring-ring-error disabled:cursor-not-allowed disabled:border disabled:border-border disabled:opacity-30',
  {
    variants: {
      roundness: {
        default: 'rounded-lg',
        round: 'rounded-[18px]',
      },
    },
    defaultVariants: {
      roundness: 'default',
    },
  },
)

type TextareaProps = ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>

function Textarea({ className, roundness, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ roundness }), className)}
      {...props}
    />
  )
}

export type { TextareaProps }
export { Textarea }
