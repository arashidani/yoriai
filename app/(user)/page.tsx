import { Role } from '@/app/generated/prisma/enums'
import { PostList } from '@/components/posts/post-list'
import { getCurrentUser } from '@/lib/auth/current-user'
import { MOCK_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getPosts() {
  if (process.env.MOCK_MODE === 'true') return MOCK_POSTS
  return prisma.post.findMany({
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function HomePage() {
  const [posts, user] = await Promise.all([getPosts(), getCurrentUser()])

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">最新の質問</h1>
      <PostList posts={posts} isAdmin={user?.role === Role.ADMIN} />
    </>
  )
}
