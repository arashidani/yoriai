import { PencilLine } from 'lucide-react'
import Link from 'next/link'
import { Role } from '@/app/generated/prisma/enums'
import { AnswerableQuestions } from '@/components/posts/answerable-questions'
import { QaCover } from '@/components/posts/qa-cover'
import { QaFeed } from '@/components/posts/qa-feed'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/current-user'
import { createServerApiClient } from '@/lib/hono/server-client'

export default async function QaHomePage() {
  const api = await createServerApiClient()
  const [questionsResponse, tagsResponse, user] = await Promise.all([
    api.questions.index.$get({ query: { page: '1', pageSize: '10', status: 'all' } }),
    api.questionTags.index.$get(),
    getCurrentUser(),
  ])

  const questionsBody = questionsResponse.ok
    ? await questionsResponse.json()
    : { questions: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } }
  const tagsBody = tagsResponse.ok ? await tagsResponse.json() : { tags: [] }
  const posts = questionsBody.questions.map((question) => ({
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

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <QaCover />
      <div className="flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-25 items-center justify-between border-b border-input bg-background p-8">
            <h1 className="font-heading text-heading-3">なんでもQ&A</h1>
            <Link
              href="/posts/new"
              className={buttonVariants({ size: 'lg', className: 'rounded-full px-5' })}
            >
              <PencilLine />
              質問する
            </Link>
          </header>
          <QaFeed
            posts={posts}
            isAdmin={user?.role === Role.ADMIN}
            allTags={tagsBody.tags}
            initialTotalPages={questionsBody.pagination.totalPages}
          />
        </div>
        {/* TODO: BusinessSkillとQ&Aタグの関連付け後、OPEN・本人以外の推薦APIへ変更する。現状は一覧先頭3件。 */}
        <AnswerableQuestions posts={posts} />
      </div>
    </div>
  )
}
