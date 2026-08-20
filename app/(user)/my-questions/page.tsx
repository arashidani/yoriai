import Link from 'next/link'

import { Button } from '@/components/design-system/button'
import { IconBookmark } from '@/components/design-system/icons/icon-bookmark'
import { IconPencil } from '@/components/design-system/icons/icon-pencil'
import { BookmarkQuestionItemList } from '@/components/design-system/ui/bookmark-question-item-list'
import { EmptyState } from '@/components/design-system/ui/empty-state'
import { HeaderSection } from '@/components/design-system/ui/header-section'
import { TabBar } from '@/components/design-system/ui/tab-bar'
import { MyQuestionsPagination } from '@/components/my-questions/my-questions-pagination'
import { PostedQuestionList } from '@/components/my-questions/posted-question-list'
import { Separator } from '@/components/ui/separator'
import { createServerApiClient } from '@/lib/hono/server-client'
import { toBookmarkQuestionItemData, toMyQuestionItemData, toQaPost } from '@/lib/questions/qa-post'

type Props = {
  searchParams: Promise<{ tab?: string; page?: string }>
}

function positivePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export default async function MyQuestionsPage({ searchParams }: Props) {
  const params = await searchParams
  const tab = params.tab === 'saved' ? 'saved' : 'posted'
  const page = positivePage(params.page)
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
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <HeaderSection
        className="h-14"
        actions={
          <Button variant="secondary" size="large" render={<Link href="/" />} nativeButton={false}>
            一覧に戻る
          </Button>
        }
      />
      <div className="mt-8 flex flex-col items-start">
        <TabBar
          value={tab}
          items={[
            {
              value: 'posted',
              label: '投稿した質問',
              icon: <IconPencil className="size-full text-primary" />,
              href: '/my-questions?tab=posted&page=1',
            },
            {
              value: 'saved',
              label: '保存した質問',
              icon: <IconBookmark className="size-full text-amber-400" />,
              href: '/my-questions?tab=saved&page=1',
            },
          ]}
        />
        <Separator />
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
      </div>
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
    </main>
  )
}
