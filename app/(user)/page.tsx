import { PencilLine } from 'lucide-react'
import Link from 'next/link'
import { Role } from '@/app/generated/prisma/enums'
import { AnswerableQuestions } from '@/components/posts/answerable-questions'
import { QaFeed } from '@/components/posts/qa-feed'
import { buttonVariants } from '@/components/ui/button'
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
  const isAdmin = user?.role === Role.ADMIN

  return (
    <div className="flex flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-25 items-center justify-between border-b border-input bg-background p-8">
          <h1 className="font-heading text-heading-3">おせっかいQA</h1>
          <Link
            href="/posts/new"
            className={buttonVariants({ size: 'lg', className: 'rounded-full px-5' })}
          >
            <PencilLine />
            質問する
          </Link>
        </header>
        <QaFeed posts={posts} isAdmin={isAdmin} />
      </div>
      <AnswerableQuestions posts={posts} />
    </div>
  )
}
