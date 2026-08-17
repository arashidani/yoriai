import { Role } from '@/app/generated/prisma/enums'
import { HeaderSection } from '@/components/design-system/ui/header-section'
import { AnswerableQuestions } from '@/components/posts/answerable-questions'
import { QaCover } from '@/components/posts/qa-cover'
import { QaFeed } from '@/components/posts/qa-feed'
import { QuestionComposeDialog } from '@/components/posts/question-compose-dialog'
import { getCurrentUser } from '@/lib/auth/current-user'
import { createServerApiClient } from '@/lib/hono/server-client'
import { toQaPost } from '@/lib/questions/qa-post'

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
  const posts = questionsBody.questions.map(toQaPost)

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <QaCover />
      <div className="flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <HeaderSection
            className="sticky top-0 z-30 h-25 p-8"
            title="なんでもQ&A"
            actions={<QuestionComposeDialog displayName={user?.username || 'ユーザー'} />}
          />
          <QaFeed
            posts={posts}
            isAdmin={user?.role === Role.ADMIN}
            allTags={tagsBody.tags}
            initialTotalPages={questionsBody.pagination.totalPages}
            initialTotal={questionsBody.pagination.total}
          />
        </div>
        {/* TODO: BusinessSkillとQ&Aタグの関連付け後、OPEN・本人以外の推薦APIへ変更する。現状は一覧先頭3件。 */}
        <AnswerableQuestions posts={posts} />
      </div>
    </div>
  )
}
