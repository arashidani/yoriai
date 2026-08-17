import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const tenureChipVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap bg-lime-100 font-bold text-lime-600',
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

type TenureChipProps = VariantProps<typeof tenureChipVariants> & {
  className?: string
  children: React.ReactNode
}

function TenureChip({ className, size = 'default', children }: TenureChipProps) {
  return (
    <span data-slot="tenure-chip" className={cn(tenureChipVariants({ size }), className)}>
      {children}
    </span>
  )
}

export { TenureChip }
