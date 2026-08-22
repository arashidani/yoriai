import type { QueryClient } from '@tanstack/react-query'

import type { QaPost } from '@/lib/questions/qa-post'

export type QuestionInteractionPatch = Partial<
  Pick<QaPost, 'saved' | 'bookmarkCount' | 'liked' | 'likeCount'>
>

type QuestionsCache = {
  posts: QaPost[]
  totalPages: number
  total: number
}

export function questionInteractionKey(postId: string) {
  return ['question-interaction', postId] as const
}

function fromQuestionsListCache(
  queryClient: QueryClient,
  postId: string,
): QuestionInteractionPatch | undefined {
  const queries = queryClient.getQueriesData<QuestionsCache>({ queryKey: ['questions'] })
  for (const [, data] of queries) {
    if (!data?.posts) continue
    const post = data.posts.find((item) => item.id === postId)
    if (!post) continue
    return {
      saved: post.saved,
      bookmarkCount: post.bookmarkCount,
      liked: post.liked,
      likeCount: post.likeCount,
    }
  }
  return undefined
}

/** 一覧での optimistic 更新を詳細画面へ引き継ぐ。専用キャッシュを優先し、無ければ一覧クエリを参照する。 */
export function getQuestionInteractionFromCache(
  queryClient: QueryClient,
  postId: string,
): QuestionInteractionPatch | undefined {
  const dedicated = queryClient.getQueryData<QuestionInteractionPatch>(
    questionInteractionKey(postId),
  )
  if (dedicated) return dedicated
  return fromQuestionsListCache(queryClient, postId)
}

export function patchQuestionInteractionCache(
  queryClient: QueryClient,
  postId: string,
  patch: QuestionInteractionPatch,
) {
  queryClient.setQueryData<QuestionInteractionPatch>(questionInteractionKey(postId), (current) => ({
    ...current,
    ...patch,
  }))
}
