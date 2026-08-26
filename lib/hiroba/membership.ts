import { MOCK_JOINED_HIROBA_SLUGS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { isDefaultHiroba } from './catalog'

export async function getHirobaJoined(
  hirobaSlug: string,
  hirobaId: string,
  userId: string | undefined,
) {
  if (!userId) return false
  if (isDefaultHiroba(hirobaSlug)) return true

  if (process.env.MOCK_MODE === 'true') {
    return MOCK_JOINED_HIROBA_SLUGS.includes(
      hirobaSlug as (typeof MOCK_JOINED_HIROBA_SLUGS)[number],
    )
  }

  return !!(await prisma.hirobaMembership.findUnique({
    where: { userId_hirobaId: { userId, hirobaId } },
    select: { userId: true },
  }))
}
