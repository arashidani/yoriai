'use client'

import type { QaPost } from '@/lib/questions/qa-post'
import { QaFeedFilters } from './qa-feed-filters'
import { QaFeedList } from './qa-feed-list'
import type { QuestionTagCategory } from './qa-filter-bar'

type QaFeedProps = {
  posts?: QaPost[]
  isAdmin: boolean
  tagCategories: QuestionTagCategory[]
  initialTotalPages?: number
  initialTotal?: number
}

/** 検索・状態・親カテゴリー・小ジャンル・ページをAPI Queryへ反映する質問一覧。 */
function QaFeed({
  posts,
  isAdmin,
  tagCategories,
  initialTotalPages = 1,
  initialTotal = 0,
}: QaFeedProps) {
  return (
    <div className="relative flex flex-1 flex-col">
      <QaFeedFilters tagCategories={tagCategories} />
      <QaFeedList
        posts={posts}
        isAdmin={isAdmin}
        initialTotalPages={initialTotalPages}
        initialTotal={initialTotal}
      />
    </div>
  )
}

export { QaFeed }
