import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QuestionStatus } from '@/app/generated/prisma/enums'
import { AnswerCard } from '@/components/posts/answer-card'
import { AnswerForm } from '@/components/posts/answer-form'
import { QuestionLikeButton } from '@/components/posts/question-like-button'
import { ResolveButton } from '@/components/posts/resolve-button'
import { SaveButton } from '@/components/posts/save-button'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/current-user'
import { MOCK_ANSWERS, MOCK_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

type Props = {
  params: Promise<{ id: string }>
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: '未回答',
  ANSWERED: '回答あり',
  RESOLVED: '解決済み',
  HIDDEN: '非表示',
}

async function getPost(id: string) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_POSTS.find((p) => p.id === id) ?? null
  }
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      postAnonymousProfile: { include: { anonymousProfile: true } },
    },
  })
}

async function getAnswers(postId: string, currentUserId: string | undefined) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_ANSWERS.filter((a) => a.postId === postId)
      .sort((a, b) => b.likeCount - a.likeCount || a.createdAt.getTime() - b.createdAt.getTime())
      .map((a) => ({
        id: a.id,
        body: a.body,
        displayName: a.anonymousProfile.displayName,
        isOwnAnswer: !!currentUserId && a.authorId === currentUserId,
        likeCount: a.likeCount,
        createdAt: a.createdAt,
      }))
  }
  const answers = await prisma.answer.findMany({
    where: { postId },
    include: {
      author: true,
      postAnonymousProfile: { include: { anonymousProfile: true } },
    },
    orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }],
  })
  return answers.map((answer) => {
    const isOwnAnswer = !!currentUserId && answer.authorId === currentUserId
    return {
      id: answer.id,
      body: answer.body,
      displayName: isOwnAnswer
        ? (answer.author?.name ?? answer.author?.email ?? '自分')
        : answer.postAnonymousProfile.anonymousProfile.displayName,
      isOwnAnswer,
      likeCount: answer.likeCount,
      createdAt: answer.createdAt,
    }
  })
}

async function getViewerState(userId: string | undefined, postId: string, answerIds: string[]) {
  if (!userId || process.env.MOCK_MODE === 'true') {
    return { questionLiked: false, questionSaved: false, likedAnswerIds: new Set<string>() }
  }
  const [questionLike, questionBookmark, answerLikes] = await Promise.all([
    prisma.questionLike.findUnique({ where: { postId_userId: { postId, userId } } }),
    prisma.postBookmark.findUnique({ where: { postId_userId: { postId, userId } } }),
    answerIds.length > 0
      ? prisma.answerLike.findMany({
          where: { userId, answerId: { in: answerIds } },
          select: { answerId: true },
        })
      : Promise.resolve([]),
  ])
  return {
    questionLiked: !!questionLike,
    questionSaved: !!questionBookmark,
    likedAnswerIds: new Set(answerLikes.map((like) => like.answerId)),
  }
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params
  const [post, currentUser] = await Promise.all([getPost(id), getCurrentUser()])
  if (!post) notFound()

  const isAuthor = !!currentUser && currentUser.id === post.authorId
  const answers = await getAnswers(id, currentUser?.id)
  const { questionLiked, questionSaved, likedAnswerIds } = await getViewerState(
    currentUser?.id,
    id,
    answers.map((a) => a.id),
  )

  const displayName = isAuthor
    ? (post.author?.name ?? post.author?.email ?? '自分')
    : (post.postAnonymousProfile?.anonymousProfile.displayName ?? '匿名')
  const canAnswer = post.status === QuestionStatus.OPEN || post.status === QuestionStatus.ANSWERED

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
          {STATUS_LABEL[post.status] ?? post.status}
        </span>
      </div>

      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        <span>{displayName}</span>
        <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
      </div>
      <div className="prose max-w-none">
        <p className="whitespace-pre-wrap">{post.body}</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {!isAuthor && (
          <QuestionLikeButton
            postId={post.id}
            initialLiked={questionLiked}
            initialLikeCount={post.likeCount}
          />
        )}
        <SaveButton postId={post.id} initialSaved={questionSaved} />
        {isAuthor && canAnswer && <ResolveButton postId={post.id} />}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-heading-4">回答 {answers.length}件</h2>
        {answers.length === 0 ? (
          <p className="text-secondary-foreground">まだ回答がありません。</p>
        ) : (
          <div className="grid gap-3">
            {answers.map((answer) => (
              <AnswerCard key={answer.id} answer={answer} liked={likedAnswerIds.has(answer.id)} />
            ))}
          </div>
        )}
      </section>

      {canAnswer ? (
        <section id="answer-form" className="mt-8 scroll-mt-8">
          <h2 className="mb-3 text-heading-4">回答する</h2>
          <AnswerForm postId={post.id} />
        </section>
      ) : (
        <p className="mt-8 text-secondary-foreground">この質問は回答を受け付けていません。</p>
      )}
    </article>
  )
}
