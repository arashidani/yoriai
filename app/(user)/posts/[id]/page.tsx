import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
    <article className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← 一覧に戻る
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
        <span>{post.author ? (post.author.name ?? post.author.email) : '退会したユーザー'}</span>
        <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
      </div>
      <div className="prose max-w-none">
        <p className="whitespace-pre-wrap">{post.body}</p>
      </div>
    </article>
  )
}
