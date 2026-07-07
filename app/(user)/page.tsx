import Typography from '@mui/material/Typography'
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
      <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        最新の質問
      </Typography>
      {posts.length === 0 ? (
        <Typography color="text.secondary">まだ質問がありません。</Typography>
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
