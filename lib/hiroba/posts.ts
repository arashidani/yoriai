import { findHiroba, HIROBA_CATALOG } from '@/lib/hiroba/catalog'
import { MOCK_HIROBA_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'
import { publicTagSelect } from '@/lib/prisma/selects'

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000

export async function getHiroba(slug: string) {
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

async function getRawPost(postId: string) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_HIROBA_POSTS.find((p) => p.id === postId) ?? null
  }
  const post = await prisma.hirobaPost.findFirst({
    where: { id: postId, deletedAt: null },
    include: { author: true, tags: { include: { tag: { select: publicTagSelect } } } },
  })
  return post ? { ...post, tags: post.tags.map((pt) => pt.tag) } : null
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

function toHirobaPost(
  post: Awaited<ReturnType<typeof getRawPosts>>[number],
  hirobaSlug: string,
  currentUserId: string | undefined,
  likedPostIds: Set<string>,
  savedPostIds: Set<string>,
) {
  return {
    id: post.id,
    hirobaSlug,
    title: post.title,
    body: post.body,
    imageUrl: post.imageUrl,
    authorId: post.authorId,
    displayName:
      post.author?.username ?? post.author?.name ?? post.author?.email ?? '削除されたユーザー',
    displayNameColor: post.author?.displayNameColor ?? null,
    avatarUrl: post.author?.avatarUrl ?? null,
    lunchPreference: post.author?.lunchPreference ?? null,
    isOwnPost: !!currentUserId && post.authorId === currentUserId,
    likeCount: post.likeCount,
    liked: likedPostIds.has(post.id),
    saved: savedPostIds.has(post.id),
    answerCount: post.answerCount,
    tags: post.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    createdAt: post.createdAt,
  }
}

export async function getHirobaPosts(
  hirobaId: string,
  hirobaSlug: string,
  currentUserId: string | undefined,
) {
  const rawPosts = await getRawPosts(hirobaId)
  const { likedPostIds, savedPostIds } = await getViewerState(
    currentUserId,
    rawPosts.map((p) => p.id),
  )

  return rawPosts.map((post) =>
    toHirobaPost(post, hirobaSlug, currentUserId, likedPostIds, savedPostIds),
  )
}

export async function getHirobaPost(
  postId: string,
  hirobaSlug: string,
  currentUserId: string | undefined,
) {
  const rawPost = await getRawPost(postId)
  if (!rawPost) return null

  const { likedPostIds, savedPostIds } = await getViewerState(currentUserId, [postId])
  return toHirobaPost(rawPost, hirobaSlug, currentUserId, likedPostIds, savedPostIds)
}

/** 全ひろば横断で、直近3日以内に投稿されたいいね数上位3件を返す。 */
export async function getPopularPosts() {
  if (process.env.MOCK_MODE === 'true') {
    return [...MOCK_HIROBA_POSTS]
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 3)
      .map((post) => ({
        id: post.id,
        hirobaSlug: HIROBA_CATALOG.find((hiroba) => hiroba.id === post.hirobaId)?.slug ?? '',
        title: post.title,
        body: post.body,
      }))
  }

  const posts = await prisma.hirobaPost.findMany({
    where: { createdAt: { gte: new Date(Date.now() - THREE_DAYS_IN_MS) }, deletedAt: null },
    select: { id: true, title: true, body: true, hiroba: { select: { slug: true } } },
    orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
    take: 3,
  })
  return posts.map(({ hiroba, ...post }) => ({ ...post, hirobaSlug: hiroba.slug }))
}
