import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Role } from '@/app/generated/prisma/enums'
import { Button } from '@/components/design-system/button'
import { AnswerCard } from '@/components/design-system/ui/answer-card'
import { PostCard } from '@/components/design-system/ui/post-card'
import { HirobaAnswerTextarea } from '@/components/hiroba/hiroba-answer-textarea'
import { HirobaJoinButton } from '@/components/hiroba/hiroba-join-button'
import { HirobaSidebar } from '@/components/hiroba/hiroba-sidebar'
import { getCurrentUser } from '@/lib/auth/current-user'
import { canJoinHiroba } from '@/lib/hiroba/catalog'
import { getHirobaJoined } from '@/lib/hiroba/membership'
import { getHiroba, getHirobaPost, getPopularPosts } from '@/lib/hiroba/posts'
import { MOCK_HIROBA_ANSWERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

type Props = {
  params: Promise<{ slug: string; postId: string }>
}

async function getAnswers(postId: string, currentUserId: string | undefined) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_HIROBA_ANSWERS.filter((a) => a.hirobaPostId === postId)
      .sort((a, b) => b.likeCount - a.likeCount || a.createdAt.getTime() - b.createdAt.getTime())
      .map((a) => ({
        id: a.id,
        body: a.body,
        authorId: a.authorId,
        displayName:
          a.author?.username ?? a.author?.name ?? a.author?.email ?? '削除されたユーザー',
        displayNameColor: a.author?.displayNameColor ?? null,
        avatarUrl: a.author?.avatarUrl ?? null,
        lunchPreference: a.author?.lunchPreference ?? null,
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
    authorId: answer.authorId,
    displayName:
      answer.author?.username ??
      answer.author?.name ??
      answer.author?.email ??
      '削除されたユーザー',
    displayNameColor: answer.author?.displayNameColor ?? null,
    avatarUrl: answer.author?.avatarUrl ?? null,
    lunchPreference: answer.author?.lunchPreference ?? null,
    isOwnAnswer: !!currentUserId && answer.authorId === currentUserId,
    likeCount: answer.likeCount,
    createdAt: answer.createdAt,
  }))
}

async function getViewerAnswerState(userId: string | undefined, answerIds: string[]) {
  if (!userId || process.env.MOCK_MODE === 'true' || answerIds.length === 0) {
    return { likedAnswerIds: new Set<string>() }
  }
  const answerLikes = await prisma.hirobaAnswerLike.findMany({
    where: { userId, hirobaAnswerId: { in: answerIds } },
    select: { hirobaAnswerId: true },
  })
  return { likedAnswerIds: new Set(answerLikes.map((like) => like.hirobaAnswerId)) }
}

export default async function HirobaPostDetailPage({ params }: Props) {
  const { slug, postId } = await params
  const [hiroba, currentUser] = await Promise.all([getHiroba(slug), getCurrentUser()])
  if (!hiroba) notFound()

  const [post, joined, popularPosts] = await Promise.all([
    getHirobaPost(postId, slug, currentUser?.id),
    getHirobaJoined(hiroba.slug, hiroba.id, currentUser?.id, currentUser?.displayNameColor),
    getPopularPosts(),
  ])
  if (!post) notFound()

  const answers = await getAnswers(postId, currentUser?.id)
  const { likedAnswerIds } = await getViewerAnswerState(
    currentUser?.id,
    answers.map((a) => a.id),
  )

  return (
    <>
      <div className="flex h-screen flex-1 flex-col space-y-8 overflow-hidden">
        <div className="flex justify-between">
          <Link href={`/hiroba/${slug}`}>
            <Button variant="secondary" size="large">
              ひろばに戻る
            </Button>
          </Link>

          {!joined && (
            <HirobaJoinButton
              slug={slug}
              joined={joined}
              canJoin={canJoinHiroba(slug, currentUser?.displayNameColor)}
            />
          )}
        </div>

        <div className="mx-3 flex min-h-0 flex-col space-y-4">
          <div className="flex min-h-0 flex-1 flex-col">
            <PostCard
              post={post}
              joined={joined}
              border="default"
              className="rounded-b-none"
              isAdmin={currentUser?.role === Role.ADMIN}
            />

            {answers.length > 0 && (
              <div className="min-h-0 flex-1 overflow-y-auto scrollbar-custom border-x-2 border-b-2 border-border-2 rounded-b-lg px-6 py-4 space-y-3">
                {answers.map((answer) => (
                  <AnswerCard
                    key={answer.id}
                    answer={answer}
                    liked={likedAnswerIds.has(answer.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {joined && <HirobaAnswerTextarea postId={post.id} />}
        </div>
      </div>

      <HirobaSidebar hiroba={hiroba} popularPosts={popularPosts} />
    </>
  )
}
