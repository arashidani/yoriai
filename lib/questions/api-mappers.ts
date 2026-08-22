import type { QuestionStatus } from '@/app/generated/prisma/enums'

// biome-ignore lint/suspicious/noExplicitAny: mapper accepts Prisma include and mock shapes
type LooseRecord = Record<string, any>

function firstTag(post: LooseRecord) {
  const tags = [...(post.tags ?? [])].sort((a, b) => {
    const time = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    return time || String(a.id ?? '').localeCompare(String(b.id ?? ''))
  })
  const value = tags[0]?.tag ?? tags[0]
  return value ? { id: value.id, name: value.name } : null
}

function displayAuthor(record: LooseRecord, isOwn: boolean) {
  if (isOwn) {
    return {
      displayName: record.author?.name ?? record.author?.email ?? '自分',
      avatarUrl: null,
    }
  }
  const profile = record.postAnonymousProfile?.anonymousProfile ?? record.anonymousProfile ?? null
  return {
    displayName: profile?.displayName ?? '匿名',
    avatarUrl: profile?.avatarUrl ?? null,
  }
}

function bookmarkCountOf(post: LooseRecord) {
  if (typeof post.bookmarkCount === 'number') return post.bookmarkCount
  if (typeof post._count?.bookmarks === 'number') return post._count.bookmarks
  return 0
}

export function toQuestionResponse(post: LooseRecord, viewerId: string) {
  const isOwnQuestion = post.authorId === viewerId
  const bookmarks = post.bookmarks ?? []
  const saved = bookmarks.some((bookmark: LooseRecord) => bookmark.userId === viewerId)
  const bookmarkCount = bookmarkCountOf(post)
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    status: post.status as Exclude<QuestionStatus, 'HIDDEN'>,
    answerCount: post.answerCount ?? 0,
    likeCount: post.likeCount ?? 0,
    liked: (post.likes ?? []).some((like: LooseRecord) => like.userId === viewerId),
    bookmarkCount,
    saved,
    isOwnQuestion,
    displayAuthor: displayAuthor(post, isOwnQuestion),
    tag: firstTag(post),
    resolvedAt: post.resolvedAt ?? null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

export function toQaAnswerResponse(
  answer: LooseRecord,
  viewerId: string,
  mostLikedAnswerId: string | null,
) {
  const isOwnAnswer = answer.authorId === viewerId
  return {
    id: answer.id,
    questionId: answer.postId,
    body: answer.body,
    likeCount: answer.likeCount ?? 0,
    liked: (answer.likes ?? []).some((like: LooseRecord) => like.userId === viewerId),
    isOwnAnswer,
    isMostLiked: answer.id === mostLikedAnswerId,
    displayAuthor: displayAuthor(answer, isOwnAnswer),
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  }
}

export function getMostLikedAnswerId(
  status: QuestionStatus,
  answers: LooseRecord[],
): string | null {
  if (status !== 'RESOLVED') return null
  const ordered = [...answers].sort(
    (a, b) =>
      (b.likeCount ?? 0) - (a.likeCount ?? 0) ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
      String(a.id).localeCompare(String(b.id)),
  )
  return (ordered[0]?.likeCount ?? 0) > 0 ? ordered[0].id : null
}
