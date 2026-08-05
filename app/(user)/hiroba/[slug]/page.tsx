import { notFound } from 'next/navigation'
import { Role } from '@/app/generated/prisma/enums'
import { HirobaFeed } from '@/components/hiroba/hiroba-feed'
import { getCurrentUser } from '@/lib/auth/current-user'
import { MOCK_HIROBA_POSTS, MOCK_HIROBAS, MOCK_TAGS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getHiroba(slug: string) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_HIROBAS.find((h) => h.slug === slug) ?? null
  }
  return prisma.hiroba.findUnique({ where: { slug } })
}

async function getRawPosts(hirobaId: string) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_HIROBA_POSTS.filter((p) => p.hirobaId === hirobaId)
  }
  const posts = await prisma.hirobaPost.findMany({
    where: { hirobaId, deletedAt: null },
    include: { author: true, tags: { include: { tag: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  return posts.map((post) => ({ ...post, tags: post.tags.map((pt) => pt.tag) }))
}

async function getAllTags() {
  if (process.env.MOCK_MODE === 'true') return MOCK_TAGS
  return prisma.tag.findMany({ orderBy: { name: 'asc' } })
}

async function getViewerState(userId: string | undefined, postIds: string[]) {
  if (!userId || process.env.MOCK_MODE === 'true' || postIds.length === 0) {
    return { likedPostIds: new Set<string>(), savedPostIds: new Set<string>() }
  }
  const [likes, bookmarks] = await Promise.all([
    prisma.hirobaPostLike.findMany({
      where: { userId, hirobaPostId: { in: postIds } },
      select: { hirobaPostId: true },
    }),
    prisma.hirobaPostBookmark.findMany({
      where: { userId, hirobaPostId: { in: postIds } },
      select: { hirobaPostId: true },
    }),
  ])
  return {
    likedPostIds: new Set(likes.map((l) => l.hirobaPostId)),
    savedPostIds: new Set(bookmarks.map((b) => b.hirobaPostId)),
  }
}

async function getPosts(hirobaId: string, hirobaSlug: string, currentUserId: string | undefined) {
  const rawPosts = await getRawPosts(hirobaId)
  const { likedPostIds, savedPostIds } = await getViewerState(
    currentUserId,
    rawPosts.map((p) => p.id),
  )

  return rawPosts.map((post) => {
    const isOwnPost = !!currentUserId && post.authorId === currentUserId
    return {
      id: post.id,
      hirobaSlug,
      title: post.title,
      body: post.body,
      displayName: post.author?.name ?? post.author?.email ?? '削除されたユーザー',
      isOwnPost,
      likeCount: post.likeCount,
      liked: likedPostIds.has(post.id),
      saved: savedPostIds.has(post.id),
      answerCount: post.answerCount,
      tags: post.tags.map((tag) => ({ id: tag.id, name: tag.name })),
      createdAt: post.createdAt,
    }
  })
}

export default async function HirobaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hiroba = await getHiroba(slug)
  if (!hiroba) notFound()

  const user = await getCurrentUser()
  const posts = await getPosts(hiroba.id, hiroba.slug, user?.id)
  const allTags = await getAllTags()
  const isAdmin = user?.role === Role.ADMIN

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-25 items-center justify-between border-b border-input bg-background p-8">
        <div>
          <h1 className="font-heading text-heading-3">{hiroba.name}</h1>
          <p className="text-paragraph-small text-secondary-foreground">{hiroba.description}</p>
        </div>
      </header>
      <HirobaFeed hirobaSlug={hiroba.slug} posts={posts} isAdmin={isAdmin} allTags={allTags} />
    </div>
  )
}
