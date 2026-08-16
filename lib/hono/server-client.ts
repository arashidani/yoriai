import 'server-only'
import { hc } from 'hono/client'
import { cookies } from 'next/headers'
import app from '@/lib/hono/app'
import { meQuestionsRoute, qaQuestionsRoute, questionTagsRoute } from '@/lib/hono/routes/qa-questions'

/** 認証Cookieを引き継ぎ、ネットワークへ出ずにHono契約を通すServer Component用RPC。 */
export async function createServerApiClient() {
  const cookieStore = await cookies()
  const cookie = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')
  const customFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    app.fetch(new Request(input, init))
  const options = { headers: { cookie }, fetch: customFetch }

  return {
    questions: hc<typeof qaQuestionsRoute>('http://hono.internal/api/questions', options),
    questionTags: hc<typeof questionTagsRoute>('http://hono.internal/api/question-tags', options),
    meQuestions: hc<typeof meQuestionsRoute>('http://hono.internal/api/users/me', options),
  }
}
