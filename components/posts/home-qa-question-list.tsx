import { Role } from '@/app/generated/prisma/enums'
import { QaFeedList } from '@/components/posts/qa-feed-list'
import { getCurrentUser } from '@/lib/auth/current-user'
import { createServerApiClient } from '@/lib/hono/server-client'
import { toQaPost } from '@/lib/questions/qa-post'

async function HomeQaQuestionList() {
  const api = await createServerApiClient()
  const [questionsResponse, user] = await Promise.all([
    api.questions.index.$get({ query: { page: '1', pageSize: '10', status: 'all' } }),
    getCurrentUser(),
  ])
  const questionsBody = questionsResponse.ok
    ? await questionsResponse.json()
    : { questions: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } }

  return (
    <QaFeedList
      posts={questionsBody.questions.map(toQaPost)}
      isAdmin={user?.role === Role.ADMIN}
      initialTotalPages={questionsBody.pagination.totalPages}
      initialTotal={questionsBody.pagination.total}
      now={Date.now()}
    />
  )
}

export { HomeQaQuestionList }
