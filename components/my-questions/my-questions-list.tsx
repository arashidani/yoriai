import { BookmarkQuestionItemList } from '@/components/design-system/ui/bookmark-question-item-list'
import { EmptyState } from '@/components/design-system/ui/empty-state'
import type { MyQuestionsTab } from '@/components/my-questions/my-questions-tabs'
import { MyQuestionsPagination } from '@/components/my-questions/my-questions-pagination'
import { PostedQuestionList } from '@/components/my-questions/posted-question-list'
import { createServerApiClient } from '@/lib/hono/server-client'
import { toBookmarkQuestionItemData, toMyQuestionItemData, toQaPost } from '@/lib/questions/qa-post'

type MyQuestionsListProps = {
  tab: MyQuestionsTab
  page: number
}

async function MyQuestionsList({ tab, page }: MyQuestionsListProps) {
  const api = await createServerApiClient()
  const request =
    tab === 'saved'
      ? api.meQuestions['saved-questions'].$get({
          query: { page: String(page), pageSize: '10' },
        })
      : api.meQuestions.questions.$get({ query: { page: String(page), pageSize: '10' } })
  const response = await request
  if (!response.ok) throw new Error('質問一覧の取得に失敗しました')
  const body = await response.json()
  const { totalPages, total, pageSize } = body.pagination
  const posts = body.questions.map(toQaPost)

  return (
    <>
      {posts.length === 0 ? (
        tab === 'saved' ? (
          <EmptyState
            variant="closeEye"
            message="ボクはすぐ忘れちゃうワン"
            title="まだ何も保存していません"
            description="見返したい質問や自分が回答した質問を保存しましょう"
          />
        ) : (
          <EmptyState
            variant="uruuru"
            message="ボクが質問を届けるワン！"
            title="まだ何も投稿していません"
            description="質問一覧ページから質問を投稿することができます"
          />
        )
      ) : tab === 'saved' ? (
        <BookmarkQuestionItemList items={posts.map(toBookmarkQuestionItemData)} />
      ) : (
        <PostedQuestionList items={posts.map(toMyQuestionItemData)} />
      )}
      {total >= 1 && (
        <MyQuestionsPagination
          className="mt-6"
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          tab={tab}
        />
      )}
    </>
  )
}

export { MyQuestionsList }
