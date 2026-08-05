import { HirobaCard } from '@/components/hiroba/hiroba-card'
import { MOCK_HIROBAS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getHirobas() {
  if (process.env.MOCK_MODE === 'true') return MOCK_HIROBAS
  return prisma.hiroba.findMany({ orderBy: { createdAt: 'desc' } })
}

export default async function HirobaPage() {
  const hirobas = await getHirobas()

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-25 items-center border-b border-input bg-background p-8">
        <h1 className="font-heading text-heading-3">ひろば</h1>
      </header>
      {hirobas.length === 0 ? (
        <p className="p-8 text-secondary-foreground">まだひろばがありません。</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
          {hirobas.map((hiroba) => (
            <HirobaCard key={hiroba.id} hiroba={hiroba} />
          ))}
        </div>
      )}
    </div>
  )
}
