import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HirobaAnswerCard } from '@/components/hiroba/hiroba-answer-card'
import { HirobaAnswerForm } from '@/components/hiroba/hiroba-answer-form'
import { HirobaPostLikeButton } from '@/components/hiroba/hiroba-post-like-button'
import { HirobaSaveButton } from '@/components/hiroba/hiroba-save-button'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/current-user'
import { MOCK_HIROBA_ANSWERS, MOCK_HIROBA_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

type Props = {
  params: Promise<{ slug: string; postId: string }>
}

async function getPost(id: string) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_HIROBA_POSTS.find((p) => p.id === id) ?? null
  }
  return prisma.hirobaPost.findFirst({
    where: { id, deletedAt: null },
    include: { author: true },
  })
}

async function getAnswers(postId: string, currentUserId: string | undefined) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_HIROBA_ANSWERS.filter((a) => a.hirobaPostId === postId)
      .sort((a, b) => b.likeCount - a.likeCount || a.createdAt.getTime() - b.createdAt.getTime())
      .map((a) => ({
        id: a.id,
        body: a.body,
        displayName: a.author?.name ?? a.author?.email ?? '削除されたユーザー',
        isOwnAnswer: !!currentUserId && a.authorId === currentUserId,
        likeCount: a.likeCount,
        createdAt: a.createdAt,
      }))
  }
  const answers = await prisma.hirobaAnswer.findMany({
    where: { hirobaPostId: postId, isHidden: false },
    include: { author: true },
    orderBy: [{ likeCount: 'desc' }, { createdAt: 'asc' }],
  })
  return answers.map((answer) => ({
    id: answer.id,
    body: answer.body,
    displayName: answer.author?.name ?? answer.author?.email ?? '削除されたユーザー',
    isOwnAnswer: !!currentUserId && answer.authorId === currentUserId,
    likeCount: answer.likeCount,
    createdAt: answer.createdAt,
  }))
}

async function getViewerState(userId: string | undefined, postId: string, answerIds: string[]) {
  if (!userId || process.env.MOCK_MODE === 'true') {
    return { postLiked: false, postSaved: false, likedAnswerIds: new Set<string>() }
  }
  const [postLike, postBookmark, answerLikes] = await Promise.all([
    prisma.hirobaPostLike.findUnique({
      where: { hirobaPostId_userId: { hirobaPostId: postId, userId } },
    }),
    prisma.hirobaPostBookmark.findUnique({
      where: { hirobaPostId_userId: { hirobaPostId: postId, userId } },
    }),
    answerIds.length > 0
      ? prisma.hirobaAnswerLike.findMany({
          where: { userId, hirobaAnswerId: { in: answerIds } },
          select: { hirobaAnswerId: true },
        })
      : Promise.resolve([]),
  ])
  return {
    postLiked: !!postLike,
    postSaved: !!postBookmark,
    likedAnswerIds: new Set(answerLikes.map((like) => like.hirobaAnswerId)),
  }
}

export default async function HirobaPostDetailPage({ params }: Props) {
  const { slug, postId } = await params
  const [post, currentUser] = await Promise.all([getPost(postId), getCurrentUser()])
  if (!post) notFound()

  const isAuthor = !!currentUser && currentUser.id === post.authorId
  const answers = await getAnswers(postId, currentUser?.id)
  const { postLiked, postSaved, likedAnswerIds } = await getViewerState(
    currentUser?.id,
    postId,
    answers.map((a) => a.id),
  )

  const displayName = post.author?.name ?? post.author?.email ?? '削除されたユーザー'

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href={`/hiroba/${slug}`}>
          <Button variant="ghost" size="sm">
            ← 一覧に戻る
          </Button>
        </Link>
      </div>

      <h1 className="mb-4 text-2xl font-bold">{post.title}</h1>
      <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
        <span>{displayName}</span>
        <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
      </div>
      <div className="prose max-w-none">
        <p className="whitespace-pre-wrap">{post.body}</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {!isAuthor && (
          <HirobaPostLikeButton
            postId={post.id}
            initialLiked={postLiked}
            initialLikeCount={post.likeCount}
          />
        )}
        <HirobaSaveButton postId={post.id} initialSaved={postSaved} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-heading-4">回答 {answers.length}件</h2>
        {answers.length === 0 ? (
          <p className="text-secondary-foreground">まだ回答がありません。</p>
        ) : (
          <div className="grid gap-3">
            {answers.map((answer) => (
              <HirobaAnswerCard
                key={answer.id}
                answer={answer}
                liked={likedAnswerIds.has(answer.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section id="answer-form" className="mt-8 scroll-mt-8">
        <h2 className="mb-3 text-heading-4">回答する</h2>
        <HirobaAnswerForm postId={post.id} />
      </section>
    </article>
  )
}
