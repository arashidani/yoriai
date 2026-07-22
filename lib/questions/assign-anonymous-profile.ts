import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma/client'

/**
 * 質問スレッド内でユーザーに割り当てる匿名キャラを取得する。
 * 既存の割り当てがなければ、そのスレッドでまだ使われていない有効な匿名キャラからランダムに選び作成する。
 */
export async function getOrAssignAnonymousProfile(postId: string, userId: string) {
  const existing = await prisma.postAnonymousProfile.findUnique({
    where: { postId_userId: { postId, userId } },
  })
  if (existing) return existing

  const usedProfileIds = (
    await prisma.postAnonymousProfile.findMany({
      where: { postId },
      select: { anonymousProfileId: true },
    })
  ).map((row) => row.anonymousProfileId)

  const candidates = await prisma.anonymousProfile.findMany({
    where: { isActive: true, id: { notIn: usedProfileIds } },
  })
  if (candidates.length === 0) {
    throw new Error('割り当て可能な匿名キャラがありません')
  }
  const anonymousProfile = candidates[Math.floor(Math.random() * candidates.length)]

  try {
    return await prisma.postAnonymousProfile.create({
      data: { postId, userId, anonymousProfileId: anonymousProfile.id },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const assignment = await prisma.postAnonymousProfile.findUnique({
        where: { postId_userId: { postId, userId } },
      })
      if (assignment) return assignment
    }
    throw error
  }
}
