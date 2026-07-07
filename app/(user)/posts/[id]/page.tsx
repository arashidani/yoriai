import { notFound } from 'next/navigation'
import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { MOCK_POSTS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

type Props = {
  params: Promise<{ id: string }>
}

async function getPost(id: string) {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_POSTS.find((p) => p.id === id) ?? null
  }
  return prisma.post.findUnique({
    where: { id },
    include: { author: true },
  })
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()

  return (
    <article>
      <Box sx={{ mb: 3 }}>
        <NextLink href="/" style={{ textDecoration: 'none' }}>
          <Button variant="text" size="small">
            ← 一覧に戻る
          </Button>
        </NextLink>
      </Box>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
        {post.title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {post.author ? post.author.name ?? post.author.email : '退会したユーザー'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(post.createdAt).toLocaleDateString('ja-JP')}
        </Typography>
      </Box>
      <Typography component="p" sx={{ whiteSpace: 'pre-wrap' }}>
        {post.body}
      </Typography>
    </article>
  )
}
