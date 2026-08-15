import { Medal } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnswerCard } from '@/components/posts/answer-card'
import { AnswerForm } from '@/components/posts/answer-form'
import { QuestionLikeButton } from '@/components/posts/question-like-button'
import { ResolveButton } from '@/components/posts/resolve-button'
import { SaveButton } from '@/components/posts/save-button'
import { Button } from '@/components/ui/button'
import { createServerApiClient } from '@/lib/hono/server-client'

const STATUS_LABEL = { OPEN: '回答募集中', RESOLVED: '解決済み' } as const

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
    <article className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← 一覧に戻る
          </Button>
        </Link>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-paragraph-mini font-medium text-muted-foreground">
          {STATUS_LABEL[question.status]}
        </span>
        {question.tag && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-paragraph-mini">
            {question.tag.name}
          </span>
        )}
      </div>
      <h1 className="mb-4 text-2xl font-bold">{question.title}</h1>
      <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
        <span>{question.displayAuthor.displayName}</span>
        <span>{new Date(question.createdAt).toLocaleDateString('ja-JP')}</span>
      </div>
      <p className="whitespace-pre-wrap">{question.body}</p>
      <div className="mt-6 flex items-center gap-3">
        {!question.isOwnQuestion && (
          <QuestionLikeButton
            postId={question.id}
            initialLiked={question.liked}
            initialLikeCount={question.likeCount}
          />
        )}
        <SaveButton postId={question.id} initialSaved={question.saved} />
        {question.isOwnQuestion && canAnswer && <ResolveButton postId={question.id} />}
      </div>
      <section className="mt-10">
        <h2 className="mb-4 text-heading-4">回答 {answers.length}件</h2>
        {answers.length === 0 ? (
          <p className="text-secondary-foreground">まだ回答がありません。</p>
        ) : (
          <div className="grid gap-3">
            {answers.map((answer) => (
              <div key={answer.id} className="relative">
                {answer.isMostLiked && (
                  <Medal
                    className="absolute top-3 right-3 z-10 text-primary"
                    aria-label="最多いいね回答"
                  />
                )}
                <AnswerCard
                  answer={{
                    id: answer.id,
                    body: answer.body,
                    displayName: answer.displayAuthor.displayName,
                    isOwnAnswer: answer.isOwnAnswer,
                    likeCount: answer.likeCount,
                    createdAt: answer.createdAt,
                  }}
                  liked={answer.liked}
                />
              </div>
            ))}
          </div>
        )}
      </section>
      {canAnswer ? (
        <section id="answer-form" className="mt-8 scroll-mt-8">
          <h2 className="mb-3 text-heading-4">回答する</h2>
          <AnswerForm postId={question.id} />
        </section>
      ) : (
        <p className="mt-8 text-secondary-foreground">この質問は回答を受け付けていません。</p>
      )}
    </article>
  )
}
