import { HirobaSidebar } from '@/components/hiroba/hiroba-sidebar'
import { BackButton } from '@/components/mypage/back-button'
import { YoriainuProfileView } from '@/components/mypage/yoriainu-profile'
import { getPopularPosts } from '@/lib/hiroba/posts'

export default async function YoriainuMyPage() {
  const popularPosts = await getPopularPosts()

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="flex items-start gap-8">
        <section className="min-w-0 flex-1 space-y-8">
          <BackButton />
          <YoriainuProfileView />
        </section>

        <HirobaSidebar popularPosts={popularPosts} />
      </div>
    </div>
  )
}
