import { notFound } from 'next/navigation'
import { Role } from '@/app/generated/prisma/enums'
import { HirobaFeed } from '@/components/hiroba/hiroba-feed'
import { HirobaSidebar } from '@/components/hiroba/hiroba-sidebar'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getHirobaJoined } from '@/lib/hiroba/membership'
import { getHiroba, getHirobaPosts, getPopularPosts } from '@/lib/hiroba/posts'

export default async function HirobaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hiroba = await getHiroba(slug)
  if (!hiroba) notFound()

  const user = await getCurrentUser()
  const isAdmin = user?.role === Role.ADMIN
  const [posts, joined, popularPosts] = await Promise.all([
    getHirobaPosts(hiroba.id, hiroba.slug, user?.id),
    getHirobaJoined(hiroba.slug, hiroba.id, user?.id),
    getPopularPosts(),
  ])

  return (
    <>
      <HirobaFeed hiroba={hiroba} posts={posts} isAdmin={isAdmin} initialJoined={joined} />
      <HirobaSidebar hiroba={hiroba} popularPosts={popularPosts} showAiSummary />
    </>
  )
}
