import type { AnonymousProfile, Answer, PostAnonymousProfile } from '@/app/generated/prisma/client'
import {
  anonymousProfileDisplayName,
  avatarUrlForAlias,
} from '@/lib/questions/anonymous-profile-display'

type AnswerWithAnonymousProfile = Answer & {
  postAnonymousProfile: PostAnonymousProfile & { anonymousProfile: AnonymousProfile }
}

export function toAnswerAnonymousProfileResponse(profile: AnonymousProfile, aliasNumber = 1) {
  return {
    id: profile.id,
    displayName: anonymousProfileDisplayName(profile.displayName, aliasNumber),
    avatarUrl: avatarUrlForAlias(profile.avatarUrls, aliasNumber),
  }
}

/** AIフラグ管理・回答復元APIで使用する管理画面専用の回答レスポンスmapper。 */
export function toAdminAnswerResponse(answer: AnswerWithAnonymousProfile) {
  return {
    id: answer.id,
    postId: answer.postId,
    body: answer.body,
    isHidden: answer.isHidden,
    likeCount: answer.likeCount,
    anonymousProfile: toAnswerAnonymousProfileResponse(
      answer.postAnonymousProfile.anonymousProfile,
      answer.postAnonymousProfile.aliasNumber,
    ),
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  }
}
