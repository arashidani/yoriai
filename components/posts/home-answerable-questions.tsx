import { AnswerableQuestions } from '@/components/posts/answerable-questions'
import { createServerApiClient } from '@/lib/hono/server-client'

async function HomeAnswerableQuestions() {
  const api = await createServerApiClient()
  const answerableResponse = await api.questions.answerable.$get()
  const answerableBody = answerableResponse.ok ? await answerableResponse.json() : { questions: [] }

  return <AnswerableQuestions posts={answerableBody.questions} />
}

export { HomeAnswerableQuestions }
