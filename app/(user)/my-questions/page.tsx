import Link from 'next/link'
import { QuestionItemList } from '@/components/design-system/ui/question-item-list'
import { buttonVariants } from '@/components/ui/button'
import { createServerApiClient } from '@/lib/hono/server-client'
import { toQaPost, toQuestionItemData } from '@/lib/questions/qa-post'

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
  const totalPages = body.pagination.totalPages
  const queryForPage = (targetPage: number) => `/my-questions?tab=${tab}&page=${targetPage}`
  const items = body.questions.map((question) => toQuestionItemData(toQaPost(question)))

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="font-heading text-heading-3">投稿・保存した質問</h1>
      <nav className="my-6 flex gap-2" aria-label="質問一覧の切り替え">
        <Link
          href="/my-questions?tab=posted&page=1"
          className={buttonVariants({ variant: tab === 'posted' ? 'default' : 'outline' })}
        >
          投稿した質問
        </Link>
        <Link
          href="/my-questions?tab=saved&page=1"
          className={buttonVariants({ variant: tab === 'saved' ? 'default' : 'outline' })}
        >
          保存した質問
        </Link>
      </nav>
      <section aria-labelledby="question-list-heading">
        <h2 id="question-list-heading" className="mb-4 text-heading-4">
          {tab === 'saved' ? '保存した質問' : '投稿した質問'}
        </h2>
        {/* TODO: 質問がない場合のUIを後で追加する */}
        {items.length === 0 ? (
          <p className="text-secondary-foreground">まだ質問がありません。</p>
        ) : (
          <QuestionItemList items={items} />
        )}
        {totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-3" aria-label="ページ送り">
            {page > 1 ? (
              <Link
                href={queryForPage(page - 1)}
                className={buttonVariants({ variant: 'outline' })}
              >
                前へ
              </Link>
            ) : (
              <span className={buttonVariants({ variant: 'outline' })} aria-disabled="true">
                前へ
              </span>
            )}
            <span className="text-paragraph-small">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={queryForPage(page + 1)}
                className={buttonVariants({ variant: 'outline' })}
              >
                次へ
              </Link>
            ) : (
              <span className={buttonVariants({ variant: 'outline' })} aria-disabled="true">
                次へ
              </span>
            )}
          </nav>
        )}
      </section>
    </main>
  )
}
