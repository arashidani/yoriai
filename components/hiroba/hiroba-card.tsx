import Link from 'next/link'
import type { HirobaCatalogItem } from '@/lib/hiroba/catalog'
import { cn } from '@/lib/utils'
import { HirobaIcon } from './hiroba-icon'

type HirobaCardProps = {
  hiroba: HirobaCatalogItem
  compact?: boolean
}

const tones = {
  pickup: 'border-hiroba-pickup-border bg-hiroba-pickup-soft text-hiroba-pickup-foreground',
  active: 'border-hiroba-active-border bg-hiroba-active-soft text-hiroba-active-foreground',
  indoor: 'border-hiroba-indoor-border bg-hiroba-indoor-soft text-hiroba-indoor-foreground',
  maniac: 'border-hiroba-maniac-border bg-hiroba-maniac-soft text-hiroba-maniac-foreground',
  food: 'border-hiroba-food-border bg-hiroba-food-soft text-hiroba-food-foreground',
  knowhow: 'border-hiroba-knowhow-border bg-hiroba-knowhow-soft text-hiroba-knowhow-foreground',
  mbtiGreen:
    'border-hiroba-mbti-green-border bg-hiroba-mbti-green-soft text-hiroba-mbti-green-foreground',
  mbtiBlue:
    'border-hiroba-mbti-blue-border bg-hiroba-mbti-blue-soft text-hiroba-mbti-blue-foreground',
  mbtiYellow:
    'border-hiroba-mbti-yellow-border bg-hiroba-mbti-yellow-soft text-hiroba-mbti-yellow-foreground',
  mbtiPurple:
    'border-hiroba-mbti-purple-border bg-hiroba-mbti-purple-soft text-hiroba-mbti-purple-foreground',
} as const

export function HirobaCard({ hiroba, compact = false }: HirobaCardProps) {
  return (
    <Link
      href={`/hiroba/${hiroba.slug}`}
      className={cn(
        'group flex min-h-13 items-center gap-3 rounded-lg border-2 px-3 py-2 font-heading text-paragraph-small font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact && 'min-w-58 py-4',
        tones[hiroba.category],
      )}
    >
      <span className="h-7 w-1 shrink-0 rounded-full bg-current opacity-50" aria-hidden />
      <HirobaIcon name={hiroba.icon} className="size-5 shrink-0" aria-hidden />
      <span className="truncate">{hiroba.name}</span>
    </Link>
  )
}
