import { cva } from 'class-variance-authority'
import Link from 'next/link'
import type { HirobaCatalogItem } from '@/lib/hiroba/catalog'
import { cn } from '@/lib/utils'
import { SquareIcons } from './square-icons'

type SquareCardProps = {
  hiroba: HirobaCatalogItem
  size?: 'large' | 'default' | 'mini'
}

const squareCardWrapperVariants = cva(
  'group flex w-full items-center rounded-lg border-2 font-heading1 font-bold transition-colors',
  {
    variants: {
      category: {
        pickup:
          'border-hiroba-pickup-border bg-hiroba-pickup-soft text-hiroba-pickup-foreground hover:bg-hiroba-pickup-border ',
        active:
          'border-hiroba-active-border bg-hiroba-active-soft text-hiroba-active-foreground hover:bg-hiroba-active-border',
        indoor:
          'border-hiroba-indoor-border bg-hiroba-indoor-soft text-hiroba-indoor-foreground hover:bg-hiroba-indoor-border',
        maniac:
          'border-hiroba-maniac-border bg-hiroba-maniac-soft text-hiroba-maniac-foreground hover:bg-hiroba-maniac-border',
        food: 'border-hiroba-food-border bg-hiroba-food-soft text-hiroba-food-foreground hover:bg-hiroba-food-border',
        knowhow:
          'border-hiroba-knowhow-border bg-hiroba-knowhow-soft text-hiroba-knowhow-foreground hover:bg-hiroba-knowhow-border',
        mbtiGreen:
          'border-hiroba-mbti-green-border bg-hiroba-mbti-green-soft text-hiroba-mbti-green-foreground hover:bg-hiroba-mbti-green-border',
        mbtiBlue:
          'border-hiroba-mbti-blue-border bg-hiroba-mbti-blue-soft text-hiroba-mbti-blue-foreground hover:bg-hiroba-mbti-blue-border',
        mbtiYellow:
          'border-hiroba-mbti-yellow-border bg-hiroba-mbti-yellow-soft text-hiroba-mbti-yellow-foreground hover:bg-hiroba-mbti-yellow-border',
        mbtiPurple:
          'border-hiroba-mbti-purple-border bg-hiroba-mbti-purple-soft text-hiroba-mbti-purple-foreground hover:bg-hiroba-mbti-purple-border',
      },
      size: {
        large: 'w-[220px] shrink-0 items-start gap-6 p-[10px]',
        default: 'items-center gap-4 p-[10px]',
        mini: 'items-center gap-2 p-[6px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

const squareCardContentVariants = cva('flex', {
  variants: {
    size: {
      large: 'flex-col gap-2 my-4',
      default: 'gap-2 items-center',
      mini: 'items-center gap-2',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

const squareCardTextVariants = cva('', {
  variants: {
    size: {
      large: 'text-body-bold',
      default: 'text-body-bold',
      mini: 'text-body-small-bold',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

const squareCardLineVariants = cva(
  'self-stretch w-1 shrink-0 rounded-full opacity-50 transition-colors',
  {
    variants: {
      category: {
        pickup: 'bg-hiroba-pickup-foreground group-hover:bg-hiroba-pickup-border',
        active: 'bg-hiroba-active-foreground group-hover:bg-hiroba-active-border',
        indoor: 'bg-hiroba-indoor-foreground group-hover:bg-hiroba-indoor-border',
        maniac: 'bg-hiroba-maniac-foreground group-hover:bg-hiroba-maniac-border',
        food: 'bg-hiroba-food-foreground group-hover:bg-hiroba-food-border',
        knowhow: 'bg-hiroba-knowhow-foreground group-hover:bg-hiroba-knowhow-border',
        mbtiGreen: 'bg-hiroba-mbti-green-foreground group-hover:bg-hiroba-mbti-green-border',
        mbtiBlue: 'bg-hiroba-mbti-blue-foreground group-hover:bg-hiroba-mbti-blue-border',
        mbtiYellow: 'bg-hiroba-mbti-yellow-foreground group-hover:bg-hiroba-mbti-yellow-border',
        mbtiPurple: 'bg-hiroba-mbti-purple-foreground group-hover:bg-hiroba-mbti-purple-border',
      },
    },
  },
)

export function SquareCard({ hiroba, size = 'default' }: SquareCardProps) {
  return (
    <Link
      href={`/hiroba/${hiroba.slug}`}
      className={cn(squareCardWrapperVariants({ category: hiroba.category, size }))}
    >
      <span className={cn(squareCardLineVariants({ category: hiroba.category }))} aria-hidden />
      <div className={cn(squareCardContentVariants({ size }))}>
        <SquareIcons name={hiroba.icon} size={size} />
        <span className={cn('truncate', squareCardTextVariants({ size }))}>{hiroba.name}</span>
      </div>
    </Link>
  )
}
