'use client'

import { useRouter } from 'next/navigation'
import Typography from '@mui/material/Typography'
import { PostForm } from '@/components/posts/post-form'
import { client } from '@/lib/hono/client'
import type { CreatePostInput } from '@/lib/schemas/post'

export default function NewPostPage() {
  const router = useRouter()

  async function handleSubmit(data: CreatePostInput) {
    const res = await client.api.posts.$post({ json: data })
    if (res.ok) {
      router.push('/')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        質問を投稿する
      </Typography>
      <PostForm onSubmit={handleSubmit} />
    </div>
  )
}
