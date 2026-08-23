import { notFound } from 'next/navigation'

import { AnswerEmptyState } from '@/components/design-system/ui/answer-empty-state'
import { QaAnswerItemList } from '@/components/posts/qa-answer-item-list'
import { Separator } from '@/components/ui/separator'
import { createServerApiClient } from '@/lib/hono/server-client'
import { getQaQuestion } from '@/lib/questions/get-qa-question'

type QaDetailAnswersProps = {
  id: string
}

async function QaDetailAnswers({ id }: QaDetailAnswersProps) {
  const api = await createServerApiClient()
  const [question, answersResponse] = await Promise.all([
    getQaQuestion(id),
    api.questions[':id'].answers.$get({ param: { id } }),
  ])
  if (!question || answersResponse.status === 404) notFound()
  if (!answersResponse.ok) throw new Error('回答の取得に失敗しました')

  const { answers } = await answersResponse.json()

  return (
    <div className="flex w-full flex-col gap-6">
      <Separator />
      {answers.length === 0 ? (
        question.status === 'RESOLVED' ? (
          <AnswerEmptyState
            variant="xx"
            title="回答がありません"
            message={'答えが気になっちゃう\nワン！'}
          />
        ) : (
          <AnswerEmptyState
            variant="shikushiku"
            title="まだ回答がありません"
            message={'ボクもこれ\n気になるワンッ...'}
          />
        )
      ) : (
        <QaAnswerItemList answers={answers} />
      )}
    </div>
  )
}

export { QaDetailAnswers }
