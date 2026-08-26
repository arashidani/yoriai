import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const MBTI_CHIP_LABELS = {
  green: 'みどりの人',
  yellow: 'きいろの人',
  blue: 'あおの人',
  purple: 'むらさきの人',
} as const

export type MbtiChipVariant = keyof typeof MBTI_CHIP_LABELS

const mbtiChipVariants = cva('inline-flex items-center justify-center tracking-normal', {
  variants: {
    variant: {
      green: 'bg-mbti-green-bg text-mbti-green',
      yellow: 'bg-mbti-yellow-bg text-mbti-yellow',
      blue: 'bg-mbti-blue-bg text-mbti-blue',
      purple: 'bg-mbti-purple-bg text-mbti-purple',
    },
    size: {
      default: 'px-2 py-0.5 text-caption-bold rounded-sm',
      large: 'px-4 py-2 text-label rounded-lg',
    },
  },
  defaultVariants: {
    variant: 'green',
    size: 'default',
  },
})

type MbtiChipProps = VariantProps<typeof mbtiChipVariants>

export function MbtiChip({ variant = 'green', size = 'default' }: MbtiChipProps) {
  const label = MBTI_CHIP_LABELS[variant ?? 'green']

  return <span className={cn(mbtiChipVariants({ variant, size }))}>{label}</span>
}
