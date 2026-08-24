import type { AnonymousProfile, Answer, PostAnonymousProfile } from '@/app/generated/prisma/client'
import {
  anonymousProfileDisplayName,
  avatarUrlForAlias,
} from '@/lib/questions/anonymous-profile-display'

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
      displayName: anonymousProfileDisplayName(
        answer.postAnonymousProfile.anonymousProfile.displayName,
        answer.postAnonymousProfile.aliasNumber,
      ),
      avatarUrl: avatarUrlForAlias(
        answer.postAnonymousProfile.anonymousProfile.avatarUrls,
        answer.postAnonymousProfile.aliasNumber,
      ),
    },
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  }
}
