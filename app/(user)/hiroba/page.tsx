import Image from 'next/image'
import hirobaCover from '@/assets/hiroba-cover.svg'
import { SquareCard } from '@/components/design-system/ui/square-card'
import { getCurrentUser } from '@/lib/auth/current-user'
import { HIROBA_CATALOG, LEFT_SECTIONS, PICKUP_SECTION, RIGHT_SECTIONS } from '@/lib/hiroba/catalog'
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
  const joinedSlugs = new Set<string>(slugs)
  return HIROBA_CATALOG.filter((hiroba) => joinedSlugs.has(hiroba.slug))
}

export default async function HirobaPage() {
  const participating = await getJoinedHirobas()

  return (
    <div className="min-w-0 flex-1 pb-12">
      <Image
        src={hirobaCover}
        alt="広場のカバーイラスト"
        sizes="100vw"
        className="h-40 w-full object-cover"
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 p-8 sm:px-8">
        <section className="rounded-xl bg-neutral-150 p-6">
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
          <div className="grid gap-3 grid-cols-4">
            {PICKUP_SECTION.items.map((hiroba) => (
              <SquareCard key={hiroba.id} hiroba={hiroba} size="default" />
            ))}
          </div>
        </section>

        <div className="flex gap-8">
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

                <div className="grid gap-3 sm:grid-cols-2">
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
