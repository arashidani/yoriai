import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/design-system/button'
import { AnswerEmptyState } from '@/components/design-system/ui/answer-empty-state'
import { QuestionCard } from '@/components/design-system/ui/question-card'
import { QuestionItemActions } from '@/components/design-system/ui/question-item-actions'
import { AnswerForm } from '@/components/posts/answer-form'
import { QaAnswerItemList } from '@/components/posts/qa-answer-item-list'
import { QaAnswerSection } from '@/components/posts/qa-answer-section'
import { Separator } from '@/components/ui/separator'
import { createServerApiClient } from '@/lib/hono/server-client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function QaDetailPage({ params }: Props) {
  const { id } = await params
  const api = await createServerApiClient()
  const [questionResponse, answersResponse] = await Promise.all([
    api.questions[':id'].$get({ param: { id } }),
    api.questions[':id'].answers.$get({ param: { id } }),
  ])
  if (questionResponse.status === 404 || answersResponse.status === 404) notFound()
  if (!questionResponse.ok || !answersResponse.ok) throw new Error('Q&Aの取得に失敗しました')

  const { question } = await questionResponse.json()
  const { answers } = await answersResponse.json()
  const canAnswer = question.status === 'OPEN'

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <div className="flex w-full items-center justify-between">
        <Link href="/">
          <Button type="button" variant="secondary" size="large">
            一覧に戻る
          </Button>
        </Link>
        <Link href="/my-questions">
          <Button type="button" variant="secondary" size="large">
            Q&A管理
          </Button>
        </Link>
      </div>
      <Separator />
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
    </article>
  )
}
