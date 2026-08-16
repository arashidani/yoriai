import Link from 'next/link'
import { PostList } from '@/components/posts/post-list'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/current-user'
import { createServerApiClient } from '@/lib/hono/server-client'

type Props = {
  searchParams: Promise<{ tab?: string; page?: string }>
}

function toPosts(
  questions: Array<{
    id: string
    title: string
    body: string
    displayAuthor: { displayName: string }
    isOwnQuestion: boolean
    likeCount: number
    liked: boolean
    saved: boolean
    status: 'OPEN' | 'RESOLVED'
    answerCount: number
    tag: { id: string; name: string } | null
    createdAt: Date | string
  }>,
) {
  return questions.map((question) => ({
    id: question.id,
    title: question.title,
    body: question.body,
    displayName: question.displayAuthor.displayName,
    isOwnQuestion: question.isOwnQuestion,
    likeCount: question.likeCount,
    liked: question.liked,
    saved: question.saved,
    status: question.status,
    answerCount: question.answerCount,
    tags: question.tag ? [question.tag] : [],
    createdAt: question.createdAt,
  }))
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
  const [response, user] = await Promise.all([request, getCurrentUser()])
  if (!response.ok) throw new Error('質問一覧の取得に失敗しました')
  const body = await response.json()
  const totalPages = body.pagination.totalPages
  const queryForPage = (targetPage: number) => `/my-questions?tab=${tab}&page=${targetPage}`

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
        <PostList posts={toPosts(body.questions)} isAdmin={user?.role === 'ADMIN'} />
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
