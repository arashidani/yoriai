import { notFound } from 'next/navigation'
import { Role } from '@/app/generated/prisma/enums'
import { HirobaFeed } from '@/components/hiroba/hiroba-feed'
import { getCurrentUser } from '@/lib/auth/current-user'
import { findHiroba, HIROBA_CATALOG, isDefaultHiroba } from '@/lib/hiroba/catalog'
import { MOCK_HIROBA_POSTS, MOCK_JOINED_HIROBA_SLUGS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { publicTagSelect } from '@/lib/prisma/selects'

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000

async function getHiroba(slug: string) {
  const catalogHiroba = findHiroba(slug)
  if (!catalogHiroba) return null

  if (process.env.MOCK_MODE === 'true') {
    return catalogHiroba
  }
  const persistedHiroba = await prisma.hiroba.findUnique({ where: { slug } })
  return persistedHiroba ? { ...catalogHiroba, id: persistedHiroba.id } : null
}

async function getRawPosts(hirobaId: string) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_HIROBA_POSTS.filter((p) => p.hirobaId === hirobaId)
  }
  const posts = await prisma.hirobaPost.findMany({
    where: { hirobaId, deletedAt: null },
    include: { author: true, tags: { include: { tag: { select: publicTagSelect } } } },
    orderBy: { updatedAt: 'desc' },
  })
  return posts.map((post) => ({ ...post, tags: post.tags.map((pt) => pt.tag) }))
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
      imageUrl: post.imageUrl,
      authorId: post.authorId,
      displayName: post.author?.name ?? post.author?.email ?? '削除されたユーザー',
      displayNameColor: post.author?.displayNameColor ?? null,
      lunchPreference: post.author?.lunchPreference ?? null,
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

async function getPopularPosts() {
  if (process.env.MOCK_MODE === 'true') {
    return [...MOCK_HIROBA_POSTS]
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 3)
      .map((post) => ({
        id: post.id,
        hirobaSlug: HIROBA_CATALOG.find((hiroba) => hiroba.id === post.hirobaId)?.slug ?? '',
        title: post.title,
      }))
  }

  const posts = await prisma.hirobaPost.findMany({
    where: { createdAt: { gte: new Date(Date.now() - THREE_DAYS_IN_MS) }, deletedAt: null },
    select: { id: true, title: true, hiroba: { select: { slug: true } } },
    orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
    take: 3,
  })
  return posts.map(({ hiroba, ...post }) => ({ ...post, hirobaSlug: hiroba.slug }))
}

export default async function HirobaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hiroba = await getHiroba(slug)
  if (!hiroba) notFound()

  const user = await getCurrentUser()
  const [posts, popularPosts] = await Promise.all([
    getPosts(hiroba.id, hiroba.slug, user?.id),
    getPopularPosts(),
  ])
  const isAdmin = user?.role === Role.ADMIN
  const joined = user
    ? isDefaultHiroba(hiroba.slug)
      ? true
      : process.env.MOCK_MODE === 'true'
        ? MOCK_JOINED_HIROBA_SLUGS.includes(
            hiroba.slug as (typeof MOCK_JOINED_HIROBA_SLUGS)[number],
          )
        : !!(await prisma.hirobaMembership.findUnique({
            where: { userId_hirobaId: { userId: user.id, hirobaId: hiroba.id } },
            select: { userId: true },
          }))
    : false

  return (
    <HirobaFeed
      hiroba={hiroba}
      posts={posts}
      popularPosts={popularPosts}
      isAdmin={isAdmin}
      initialJoined={joined}
    />
  )
}
