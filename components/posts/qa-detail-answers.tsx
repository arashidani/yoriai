import { notFound } from 'next/navigation'

import { AnswerEmptyState } from '@/components/design-system/ui/answer-empty-state'
import { QaAnswerItemList } from '@/components/posts/qa-answer-item-list'
import { Separator } from '@/components/ui/separator'
import { getQaDetail } from '@/lib/questions/get-qa-question'

type QaDetailAnswersProps = {
  id: string
}

async function QaDetailAnswers({ id }: QaDetailAnswersProps) {
  const detail = await getQaDetail(id)
  if (!detail) notFound()
  const { question, answers } = detail

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
