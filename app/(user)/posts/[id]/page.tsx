import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/design-system/button'
import { AssistBanner } from '@/components/design-system/ui/assist-banner'
import { QuestionCard } from '@/components/design-system/ui/question-card'
import { QuestionItemActions } from '@/components/design-system/ui/question-item-actions'
import { AnswerForm } from '@/components/posts/answer-form'
import { QaAnswerItemList } from '@/components/posts/qa-answer-item-list'
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
              bookmarkCount={0}
              bookmarked={question.saved}
              isOwnQuestion={question.isOwnQuestion}
              size="large"
            />
          }
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full flex-col gap-4">
          {canAnswer ? (
            <AnswerForm postId={question.id} />
          ) : (
            <p className="text-paragraph text-secondary-foreground">
              この質問は回答を受け付けていません。
            </p>
          )}
          <AssistBanner>AIが自動でカテゴリタグを付与し、回答されやすくします。</AssistBanner>
        </div>
        <p className="text-caption text-secondary-foreground">※回答にはIBJ歴が表示されます。</p>
      </div>
      <div className="flex w-full flex-col gap-6">
        <Separator />
        {answers.length === 0 ? (
          <p className="text-paragraph text-secondary-foreground">まだ回答がありません。</p>
        ) : (
          <QaAnswerItemList answers={answers} />
        )}
      </div>
    </article>
  )
}
