import type { AnonymousProfile, Answer, PostAnonymousProfile } from '@/app/generated/prisma/client'

type AnswerWithAnonymousProfile = Answer & {
  postAnonymousProfile: PostAnonymousProfile & { anonymousProfile: AnonymousProfile }
}

/** AIフラグ管理・回答復元APIで使用する管理画面専用の回答レスポンスmapper。 */
export function toAdminAnswerResponse(answer: AnswerWithAnonymousProfile) {
  return {
    id: answer.id,
    postId: answer.postId,
    body: answer.body,
    isHidden: answer.isHidden,
    likeCount: answer.likeCount,
    anonymousProfile: {
      id: answer.postAnonymousProfile.anonymousProfile.id,
      displayName: answer.postAnonymousProfile.anonymousProfile.displayName,
      avatarUrl: answer.postAnonymousProfile.anonymousProfile.avatarUrl,
    },
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  }
}
