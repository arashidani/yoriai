import { UsersRound } from 'lucide-react'
import Link from 'next/link'

export type Hiroba = {
  slug: string
  name: string
  description: string
}

type HirobaCardProps = {
  hiroba: Hiroba
}

export function HirobaCard({ hiroba }: HirobaCardProps) {
  return (
    <Link
      href={`/hiroba/${hiroba.slug}`}
      className="block rounded-xl border border-input bg-background p-5 shadow-xs transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <UsersRound className="size-5 text-secondary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-paragraph font-bold">{hiroba.name}</p>
          <p className="line-clamp-2 text-paragraph-small text-secondary-foreground">
            {hiroba.description}
          </p>
        </div>
      </div>
    </Link>
  )
}
