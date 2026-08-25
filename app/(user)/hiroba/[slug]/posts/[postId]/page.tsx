import { Utensils } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  displayNameColorClass,
  lunchStyleTag,
  mbtiColorTag,
} from '@/components/hiroba/display-name-color'
import { HirobaAnswerCard } from '@/components/hiroba/hiroba-answer-card'
import { HirobaAnswerForm } from '@/components/hiroba/hiroba-answer-form'
import { HirobaPostLikeButton } from '@/components/hiroba/hiroba-post-like-button'
import { HirobaSaveButton } from '@/components/hiroba/hiroba-save-button'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/current-user'
import { findHiroba, isDefaultHiroba } from '@/lib/hiroba/catalog'
import {
  MOCK_HIROBA_ANSWERS,
  MOCK_HIROBA_POSTS,
  MOCK_JOINED_HIROBA_SLUGS,
} from '@/lib/mocks/fixtures'
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
        authorId: a.authorId,
        displayName: a.author?.name ?? a.author?.email ?? '削除されたユーザー',
        displayNameColor: a.author?.displayNameColor ?? null,
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
    displayName: answer.author?.name ?? answer.author?.email ?? '削除されたユーザー',
    displayNameColor: answer.author?.displayNameColor ?? null,
    lunchPreference: answer.author?.lunchPreference ?? null,
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
  const hiroba = findHiroba(slug)
  const [post, currentUser] = await Promise.all([getPost(postId), getCurrentUser()])
  if (!post || !hiroba || post.hirobaId !== hiroba.id) notFound()

  const joined = currentUser
    ? isDefaultHiroba(slug)
      ? true
      : process.env.MOCK_MODE === 'true'
        ? MOCK_JOINED_HIROBA_SLUGS.includes(slug as (typeof MOCK_JOINED_HIROBA_SLUGS)[number])
        : !!(await prisma.hirobaMembership.findUnique({
            where: { userId_hirobaId: { userId: currentUser.id, hirobaId: post.hirobaId } },
            select: { userId: true },
          }))
    : false

  const isAuthor = !!currentUser && currentUser.id === post.authorId
  const answers = await getAnswers(postId, currentUser?.id)
  const { postLiked, postSaved, likedAnswerIds } = await getViewerState(
    currentUser?.id,
    postId,
    answers.map((a) => a.id),
  )

  const displayName = post.author?.name ?? post.author?.email ?? '削除されたユーザー'
  const lunchStyle = lunchStyleTag(post.author?.lunchPreference)
  const mbtiTag = mbtiColorTag(post.author?.displayNameColor)

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href={`/hiroba/${slug}`}>
          <Button variant="ghost" size="sm">
            一覧に戻る
          </Button>
        </Link>
      </div>

      <h1 className="mb-4 text-2xl font-bold">{post.title}</h1>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {post.authorId ? (
          <Link
            href={`/mypage/${post.authorId}`}
            className={`${displayNameColorClass(post.author?.displayNameColor)} hover:underline`}
          >
            {displayName}
          </Link>
        ) : (
          <span className={displayNameColorClass(post.author?.displayNameColor)}>
            {displayName}
          </span>
        )}
        {lunchStyle && (
          <span className="inline-flex items-center gap-1 rounded-full bg-lunch-style-bg px-2 py-0.5 text-paragraph-mini font-bold text-lunch-style">
            <Utensils className="size-3" aria-hidden />
            {lunchStyle}
          </span>
        )}
        {mbtiTag && (
          <span
            className={`rounded-full px-2 py-0.5 text-paragraph-mini font-bold ${mbtiTag.className}`}
          >
            {mbtiTag.label}
          </span>
        )}
        <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
      </div>
      <div className="prose max-w-none">
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt="投稿画像"
            width={1200}
            height={900}
            unoptimized
            className="rounded-lg"
          />
        )}
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
        <HirobaAnswerForm
          postId={post.id}
          hirobaSlug={slug}
          hirobaName={hiroba.name}
          initialJoined={joined}
        />
      </section>
    </article>
  )
}
