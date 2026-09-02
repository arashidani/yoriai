import { notFound } from 'next/navigation'
import { Role } from '@/app/generated/prisma/enums'
import { HirobaSidebar } from '@/components/hiroba/hiroba-sidebar'
import { TutorialHirobaFeed } from '@/components/tutorial/tutorial-hiroba-feed'
import { getCurrentUser } from '@/lib/auth/current-user'
import { canJoinHiroba } from '@/lib/hiroba/catalog'
import { getHirobaJoined } from '@/lib/hiroba/membership'
import { getHiroba, getHirobaPosts, getPopularPosts } from '@/lib/hiroba/posts'

export default async function HirobaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hiroba = await getHiroba(slug)
  if (!hiroba) notFound()

  const user = await getCurrentUser()
  const [posts, joined, popularPosts] = await Promise.all([
    getHirobaPosts(hiroba.id, hiroba.slug, user?.id),
    getHirobaJoined(hiroba.slug, hiroba.id, user?.id, user?.displayNameColor),
    getPopularPosts(),
  ])

  return (
    <>
      <TutorialHirobaFeed
        hiroba={hiroba}
        posts={posts}
        initialJoined={joined}
        canJoin={canJoinHiroba(hiroba.slug, user?.displayNameColor)}
        isAdmin={user?.role === Role.ADMIN}
      />
      <HirobaSidebar hiroba={hiroba} popularPosts={popularPosts} showAiSummary />
    </>
  )
}
