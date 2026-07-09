import { PostCard } from '@/components/posts/post-card'
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
  const posts = await getPosts()

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">最新の質問</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">まだ質問がありません。</p>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </>
  )
}
