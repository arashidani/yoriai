import { PencilLine } from 'lucide-react'
import Link from 'next/link'
import { Role } from '@/app/generated/prisma/enums'
import { AnswerableQuestions } from '@/components/posts/answerable-questions'
import { QaFeed } from '@/components/posts/qa-feed'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/current-user'
import { MOCK_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getRawPosts() {
  if (process.env.MOCK_MODE === 'true') return MOCK_POSTS
  return prisma.post.findMany({
    where: { deletedAt: null },
    include: {
      author: true,
      postAnonymousProfile: { include: { anonymousProfile: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

async function getViewerState(userId: string | undefined, postIds: string[]) {
  if (!userId || process.env.MOCK_MODE === 'true' || postIds.length === 0) {
    return { likedPostIds: new Set<string>(), savedPostIds: new Set<string>() }
  }
  const [likes, bookmarks] = await Promise.all([
    prisma.questionLike.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    }),
    prisma.postBookmark.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    }),
  ])
  return {
    likedPostIds: new Set(likes.map((l) => l.postId)),
    savedPostIds: new Set(bookmarks.map((b) => b.postId)),
  }
}

async function getPosts(currentUserId: string | undefined) {
  const rawPosts = await getRawPosts()
  const { likedPostIds, savedPostIds } = await getViewerState(
    currentUserId,
    rawPosts.map((p) => p.id),
  )

  return rawPosts.map((post) => {
    const isOwnQuestion = !!currentUserId && post.authorId === currentUserId
    const displayName = isOwnQuestion
      ? (post.author?.name ?? post.author?.email ?? '自分')
      : (post.postAnonymousProfile?.anonymousProfile.displayName ?? '匿名')

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      displayName,
      isOwnQuestion,
      likeCount: post.likeCount,
      liked: likedPostIds.has(post.id),
      saved: savedPostIds.has(post.id),
      status: post.status,
      answerCount: post.answerCount,
      createdAt: post.createdAt,
    }
  })
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const posts = await getPosts(user?.id)
  const isAdmin = user?.role === Role.ADMIN

  return (
    <div className="flex flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-25 items-center justify-between border-b border-input bg-background p-8">
          <h1 className="font-heading text-heading-3">おせっかいQA</h1>
          <Link
            href="/posts/new"
            className={buttonVariants({ size: 'lg', className: 'rounded-full px-5' })}
          >
            <PencilLine />
            質問する
          </Link>
        </header>
        <QaFeed posts={posts} isAdmin={isAdmin} />
      </div>
      <AnswerableQuestions posts={posts} />
    </div>
  )
}
