import { Coffee, Gamepad2, Music2, Plane, Sparkles, TentTree, Utensils } from 'lucide-react'
import { HirobaCard } from '@/components/hiroba/hiroba-card'
import { getCurrentUser } from '@/lib/auth/current-user'
import { DEFAULT_HIROBA_SLUGS, HIROBA_CATALOG, HIROBA_SECTIONS } from '@/lib/hiroba/catalog'
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
      <section className="relative flex h-44 items-center justify-center overflow-hidden bg-primary-subtle px-6 text-center">
        <Gamepad2
          className="absolute top-10 left-[7%] size-12 rotate-[-12deg] text-primary opacity-70"
          aria-hidden
        />
        <Utensils
          className="absolute top-8 left-[25%] size-10 rotate-12 text-primary opacity-70"
          aria-hidden
        />
        <TentTree
          className="absolute bottom-0 left-[18%] size-16 text-primary opacity-50"
          aria-hidden
        />
        <Music2
          className="absolute top-16 right-[27%] size-12 rotate-12 text-primary opacity-70"
          aria-hidden
        />
        <Plane
          className="absolute top-8 right-[12%] size-11 rotate-12 text-primary opacity-70"
          aria-hidden
        />
        <Coffee
          className="absolute bottom-8 right-[4%] size-12 text-primary opacity-70"
          aria-hidden
        />
        <div className="relative rounded-full bg-background px-8 py-5 shadow-lg">
          <Sparkles className="mx-auto mb-1 size-6 text-primary" aria-hidden />
          <h1 className="font-heading text-heading-2">好きでつながる、ひろば</h1>
          <p className="mt-1 text-paragraph-small text-secondary-foreground">
            気になる話題をのぞいてみよう
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-8">
        <section className="rounded-xl bg-background-subtle p-5">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-heading-3">
            <span className="size-3 rounded-full bg-primary" aria-hidden />
            参加中のひろば
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {participating.length === 0 ? (
              <p className="text-paragraph-small text-secondary-foreground">
                参加中のひろばはまだありません。
              </p>
            ) : (
              participating.map((hiroba) => <HirobaCard key={hiroba.id} hiroba={hiroba} compact />)
            )}
          </div>
        </section>

        <div className="grid items-start gap-x-8 gap-y-7 xl:grid-cols-2">
          {HIROBA_SECTIONS.map((section, index) => (
            <section key={section.title} className={index === 0 ? 'xl:col-span-2' : undefined}>
              <h2 className="mb-3 font-heading text-heading-3">{section.title}</h2>
              <div
                className={
                  index === 0
                    ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
                    : 'grid gap-3 sm:grid-cols-2'
                }
              >
                {section.items.map((hiroba) => (
                  <HirobaCard key={hiroba.id} hiroba={hiroba} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
