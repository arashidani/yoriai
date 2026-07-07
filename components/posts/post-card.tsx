'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

type Author = {
  id: string
  name: string | null
  email: string
}

type Post = {
  id: string
  title: string
  body: string
  author: Author | null
  createdAt: Date | string
}

type PostCardProps = {
  post: Post
}

const clamp = (lines: number) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
})

export function PostCard({ post }: PostCardProps) {
  const createdAt = new Date(post.createdAt).toLocaleDateString('ja-JP')
  const excerpt = post.body.length > 100 ? post.body.slice(0, 100) + '…' : post.body

  return (
    <Card sx={{ transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
      <CardActionArea component={Link} href={`/posts/${post.id}`}>
        <CardContent>
          <Typography variant="h6" component="h2" sx={clamp(2)}>
            {post.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ...clamp(3) }}>
            {excerpt}
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {post.author ? post.author.name ?? post.author.email : '退会したユーザー'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {createdAt}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
