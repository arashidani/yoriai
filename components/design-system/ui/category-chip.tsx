import { cva, type VariantProps } from 'class-variance-authority'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

const categoryChipVariants = cva(
  'inline-flex items-center justify-center gap-1 whitespace-nowrap bg-sky-100 font-bold text-sky-500',
  {
    variants: {
      size: {
        default: 'rounded-sm px-2 py-0.5 text-paragraph-mini',
        large: 'rounded-lg px-4 py-2 text-paragraph-small',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

type CategoryChipProps = VariantProps<typeof categoryChipVariants> & {
  className?: string
  children: React.ReactNode
}

function CategoryChip({ className, size = 'default', children }: CategoryChipProps) {
  return (
    <span data-slot="category-chip" className={cn(categoryChipVariants({ size }), className)}>
      <Sparkles className={cn('shrink-0', size === 'large' ? 'size-3.5' : 'size-3')} aria-hidden />
      {children}
    </span>
  )
}

export { CategoryChip }
