import type { AnonymousProfile, Answer, PostAnonymousProfile } from '@/app/generated/prisma/client'

type AnswerWithAnonymousProfile = Answer & {
  postAnonymousProfile: PostAnonymousProfile & { anonymousProfile: AnonymousProfile }
}

/** 管理APIが引き続き利用する従来形式の回答レスポンスmapper。 */
export function toAnswerResponse(answer: AnswerWithAnonymousProfile) {
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
