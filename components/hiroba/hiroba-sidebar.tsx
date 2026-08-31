import Image from 'next/image'
import Link from 'next/link'
import fireIcon from '@/assets/fire.svg'
import { SquareCard } from '@/components/design-system/ui/square-card'
import { SquareIcon } from '@/components/design-system/ui/square-icon'
import type { HirobaCatalogItem } from '@/lib/hiroba/catalog'
import { findHiroba, HIROBA_CATALOG } from '@/lib/hiroba/catalog'
import { stripMarkdown } from '@/lib/text/strip-markdown'
import { cn } from '@/lib/utils'
import { IconAi } from '../design-system/icons/icon-ai'

type PopularPost = { id: string; hirobaSlug: string; title: string; body: string }

type HirobaSidebarProps = {
  /** 指定すると「人気のひろば」からこのひろばを除外する */
  hiroba?: HirobaCatalogItem
  popularPosts: PopularPost[]
  /** AI要約セクションを表示するか（ひろば詳細のトップでのみ表示し、投稿詳細やマイページでは非表示にする） */
  showAiSummary?: boolean
}

const categoryForegroundClasses = {
  pickup: 'text-hiroba-pickup-foreground',
  active: 'text-hiroba-active-foreground',
  indoor: 'text-hiroba-indoor-foreground',
  maniac: 'text-hiroba-maniac-foreground',
  food: 'text-hiroba-food-foreground',
  knowhow: 'text-hiroba-knowhow-foreground',
  mbtiGreen: 'text-hiroba-mbti-green-foreground',
  mbtiBlue: 'text-hiroba-mbti-blue-foreground',
  mbtiYellow: 'text-hiroba-mbti-yellow-foreground',
  mbtiPurple: 'text-hiroba-mbti-purple-foreground',
} as const

/** ひろばに関連する補助情報（AI要約・人気のひろば・人気の投稿）。ひろば詳細画面とマイページで共用する。 */
export function HirobaSidebar({ hiroba, popularPosts, showAiSummary = false }: HirobaSidebarProps) {
  const popularHirobas = HIROBA_CATALOG.filter((item) => item.slug !== hiroba?.slug).slice(0, 3)

  return (
    <aside className="hidden max-w-[320px] shrink-0 space-y-4 xl:sticky xl:top-6 xl:block xl:self-start">
      {showAiSummary && hiroba && (
        <section className="bg-informative-background space-y-1 p-6 rounded-lg">
          <h2 className="flex items-center gap-2 text-heading-3 text-informative">
            <IconAi className="size-5" aria-hidden />
            AI要約
          </h2>

          <p className="text-body-small-bold text-informative">{hiroba.description}</p>
        </section>
      )}

      <section className="bg-background-2 p-6 space-y-3">
        <h2 className="flex items-center gap-2 font-bold text-heading-3">
          <Image src={fireIcon} width={16} height={20} alt="" />
          人気のひろば
        </h2>

        <div className="space-y-2">
          {popularHirobas.map((item) => (
            <SquareCard key={item.id} hiroba={item} size="mini" />
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-background-subtle p-5 space-y-3">
        <h2 className="flex items-center gap-2 font-bold text-heading-3">
          <Image src={fireIcon} width={16} height={20} alt="" />
          人気の投稿
        </h2>
        {popularPosts.length === 0 ? (
          <p className="text-paragraph-small text-secondary-foreground">
            投稿が集まると、ここに人気の投稿が表示されます。
          </p>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-2">
            {popularPosts.map((post) => {
              const postHiroba = findHiroba(post.hirobaSlug)
              return (
                <Link key={post.id} href={`/hiroba/${post.hirobaSlug}/posts/${post.id}`}>
                  <div className="border-2 border-border-2 p-3 bg-surface flex gap-2 min-w-0 rounded-lg hover:bg-ghost-hover transition-colors">
                    {postHiroba && (
                      <div>
                        <SquareIcon
                          hirobaIcon={postHiroba.icon}
                          category={postHiroba.category}
                          size="small"
                        />
                      </div>
                    )}

                    <div className="space-y-0.5 min-w-0 flex-1">
                      {postHiroba && (
                        <p
                          className={cn(
                            'text-caption',
                            categoryForegroundClasses[postHiroba.category],
                          )}
                        >
                          {postHiroba.name}
                        </p>
                      )}
                      <p className="text-body-small text-secondary-foreground truncate">
                        {stripMarkdown(post.body)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </aside>
  )
}
