import Link from 'next/link'
import type { HirobaCatalogItem } from '@/lib/hiroba/catalog'
import { cn } from '@/lib/utils'
import { HirobaIcon } from './hiroba-icon'

type HirobaCardProps = {
  hiroba: HirobaCatalogItem
  compact?: boolean
}

const tones = {
  yellow: 'border-hiroba-yellow-border bg-hiroba-yellow-soft text-hiroba-yellow-foreground',
  blue: 'border-hiroba-blue-border bg-hiroba-blue-soft text-hiroba-blue-foreground',
  purple: 'border-hiroba-purple-border bg-hiroba-purple-soft text-hiroba-purple-foreground',
  rose: 'border-hiroba-rose-border bg-hiroba-rose-soft text-hiroba-rose-foreground',
  lime: 'border-hiroba-lime-border bg-hiroba-lime-soft text-hiroba-lime-foreground',
  mint: 'border-hiroba-mint-border bg-hiroba-mint-soft text-hiroba-mint-foreground',
} as const

export function HirobaCard({ hiroba, compact = false }: HirobaCardProps) {
  return (
    <Link
      href={`/hiroba/${hiroba.slug}`}
      className={cn(
        'group flex min-h-13 items-center gap-3 rounded-lg border-2 px-3 py-2 font-heading text-paragraph-small font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact && 'min-w-58 py-4',
        tones[hiroba.tone],
      )}
    >
      <span className="h-7 w-1 shrink-0 rounded-full bg-current opacity-50" aria-hidden />
      <HirobaIcon name={hiroba.icon} className="size-5 shrink-0" aria-hidden />
      <span className="truncate">{hiroba.name}</span>
    </Link>
  )
}
