import { Prisma } from '@/app/generated/prisma/client'
import { prisma } from '@/lib/prisma/client'

const MAX_ASSIGN_ATTEMPTS = 5

/**
 * 質問スレッド内でユーザーに割り当てる匿名キャラを取得する。
 * 既存の割り当てがなければ、そのスレッドでまだ使われていない有効な匿名キャラからランダムに選び作成する。
 *
 * `PostAnonymousProfile` には (postId,userId) と (postId,anonymousProfileId) の
 * 2つのユニーク制約があるため、並行実行時はどちらの衝突（P2002）も起こりうる。
 * (postId,userId) 側の衝突は自分の割り当てが確定済みという意味で再取得すればよいが、
 * (postId,anonymousProfileId) 側の衝突は他ユーザーが同じキャラを取り切った競合なので、
 * 候補選択からやり直す（リトライ）必要がある。
 */
export async function getOrAssignAnonymousProfile(postId: string, userId: string) {
  for (let attempt = 0; attempt < MAX_ASSIGN_ATTEMPTS; attempt++) {
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
        continue
      }
      throw error
    }
  }

  throw new Error('匿名キャラの割り当てに失敗しました（競合が解消しませんでした）')
}
