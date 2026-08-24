import {
  SideBarContainer,
  SideBarContainerFallback,
  type SideQuestionData,
} from '@/components/design-system/ui/side-bar-container'
import { createServerApiClient } from '@/lib/hono/server-client'

const ANSWERABLE_QUESTIONS_TITLE = 'あなたが回答できる質問'
const ANSWERABLE_QUESTIONS_MESSAGE = '極秘任務だワン…！'
const ANSWERABLE_QUESTIONS_EMPTY_MESSAGE = 'まだ質問がありません。'

const answerableQuestionsAsideClassName =
  'hidden w-80 shrink-0 xl:sticky xl:top-0 xl:block xl:h-svh xl:self-start xl:pt-8 xl:pr-8'

type AnswerableQuestion = {
  id: string
  title: string
  displayAuthor: { displayName: string; avatarUrl: string | null }
  tag: { name: string } | null
}

function toSideQuestionData(question: AnswerableQuestion): SideQuestionData {
  return {
    id: question.id,
    href: `/posts/${question.id}`,
    avatarSrc: question.displayAuthor.avatarUrl ?? undefined,
    avatarAlt: question.displayAuthor.displayName,
    title: question.tag?.name ?? question.displayAuthor.displayName,
    excerpt: question.title,
  }
}

async function HomeAnswerableQuestions() {
  const api = await createServerApiClient()
  const answerableResponse = await api.questions.answerable.$get()
  const answerableBody = answerableResponse.ok ? await answerableResponse.json() : { questions: [] }
  const items = answerableBody.questions.map(toSideQuestionData)

  return (
    <aside className={answerableQuestionsAsideClassName}>
      <SideBarContainer
        title={ANSWERABLE_QUESTIONS_TITLE}
        message={ANSWERABLE_QUESTIONS_MESSAGE}
        items={items}
        emptyMessage={ANSWERABLE_QUESTIONS_EMPTY_MESSAGE}
      />
    </aside>
  )
}

function HomeAnswerableQuestionsFallback() {
  return (
    <aside className={answerableQuestionsAsideClassName}>
      <SideBarContainerFallback />
    </aside>
  )
}

export { HomeAnswerableQuestions, HomeAnswerableQuestionsFallback }
