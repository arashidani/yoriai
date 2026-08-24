import { notFound } from 'next/navigation'

import { QuestionCard } from '@/components/design-system/ui/question-card'
import { QuestionItemActions } from '@/components/design-system/ui/question-item-actions'
import { AnswerForm } from '@/components/posts/answer-form'
import { QaAnswerSection } from '@/components/posts/qa-answer-section'
import { getQaQuestion } from '@/lib/questions/get-qa-question'

type QaDetailQuestionProps = {
  id: string
}

async function QaDetailQuestion({ id }: QaDetailQuestionProps) {
  const question = await getQaQuestion(id)
  if (!question) notFound()

  const canAnswer = question.status === 'OPEN'

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        <QuestionCard
          avatarSrc={question.displayAuthor.avatarUrl ?? undefined}
          authorName={question.displayAuthor.displayName}
          date={new Date(question.createdAt).toLocaleDateString('ja-JP')}
          category={question.tag?.name}
          status={question.status}
          title={question.title}
          body={question.body}
          actions={
            <QuestionItemActions
              postId={question.id}
              commentCount={question.answerCount}
              likeCount={question.likeCount}
              liked={question.liked}
              bookmarkCount={question.bookmarkCount}
              bookmarked={question.saved}
              isOwnQuestion={question.isOwnQuestion}
              size="large"
            />
          }
        />
      </div>
      <QaAnswerSection canAnswer={canAnswer}>
        <AnswerForm postId={question.id} />
      </QaAnswerSection>
    </>
  )
}

export { QaDetailQuestion }
