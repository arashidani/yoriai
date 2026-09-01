import Image from 'next/image'
import hirobaCover from '@/assets/hiroba-cover.svg'
import { SquareCard } from '@/components/design-system/ui/square-card'
import { getCurrentUser } from '@/lib/auth/current-user'
import {
  DEFAULT_HIROBA_SLUGS,
  HIROBA_CATALOG,
  LEFT_SECTIONS,
  PICKUP_SECTION,
  RIGHT_SECTIONS,
} from '@/lib/hiroba/catalog'
import { MOCK_JOINED_HIROBA_SLUGS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getJoinedHirobas() {
  const user = await getCurrentUser()
  if (!user) return []

  const slugs =
    process.env.MOCK_MODE === 'true'
      ? MOCK_JOINED_HIROBA_SLUGS
      : (
          await prisma.hirobaMembership.findMany({
            where: { userId: user.id },
            select: { hiroba: { select: { slug: true } } },
          })
        ).map((membership) => membership.hiroba.slug)
  const joinedSlugs = new Set<string>([...slugs, ...DEFAULT_HIROBA_SLUGS])
  return HIROBA_CATALOG.filter((hiroba) => joinedSlugs.has(hiroba.slug))
}

export default async function HirobaPage() {
  const participating = await getJoinedHirobas()

  return (
    <div className="min-w-0 flex-1 pb-12">
      {/* カバーは上部に sticky で貼り付き、スクロールすると下のコンテンツが上に覆いかぶさる */}
      <div className="sticky top-1.5 z-0">
        <Image
          src={hirobaCover}
          alt="広場のカバーイラスト"
          sizes="100vw"
          className="h-40 w-full object-cover"
          loading="eager"
          preload
        />
      </div>

      {/* カバーの上にスクロールで覆いかぶさるよう、背景色付きで前面に置く */}
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 bg-background px-4 py-6 sm:px-8 xl:space-y-8 xl:p-8">
        <section className="rounded-xl bg-neutral-150 p-4 xl:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-heading-2">
            <span className="size-4 rounded-full bg-primary" aria-hidden />
            参加中のひろば
          </h2>

          <div className="flex gap-4 overflow-x-auto scrollbar-custom pb-[19px]">
            {participating.length === 0 ? (
              <p className="text-paragraph-small text-secondary-foreground">
                参加中のひろばはまだありません。
              </p>
            ) : (
              participating.map((hiroba) => (
                <SquareCard key={hiroba.id} hiroba={hiroba} size="large" />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-heading-2">{PICKUP_SECTION.title}</h2>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {PICKUP_SECTION.items.map((hiroba) => (
              <SquareCard key={hiroba.id} hiroba={hiroba} size="default" />
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-8 xl:flex-row">
          <div className="space-y-8 flex-1">
            {LEFT_SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-foreground text-heading-2">{section.title}</h2>

                <div className="grid gap-3 grid-cols-2">
                  {section.items.map((hiroba) => (
                    <SquareCard key={hiroba.id} hiroba={hiroba} size="default" />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-8 flex-1">
            {RIGHT_SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 font-heading text-heading-2">{section.title}</h2>

                <div className="grid grid-cols-2 gap-3">
                  {section.items.map((hiroba) => (
                    <SquareCard key={hiroba.id} hiroba={hiroba} size="default" />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
