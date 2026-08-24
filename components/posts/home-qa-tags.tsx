import { QaFeedFilters } from '@/components/posts/qa-feed-filters'
import { createServerApiClient } from '@/lib/hono/server-client'

async function HomeQaTags() {
  const api = await createServerApiClient()
  const tagsResponse = await api.questionTags.index.$get()
  const tagsBody = tagsResponse.ok ? await tagsResponse.json() : { categories: [] }

  return <QaFeedFilters tagCategories={tagsBody.categories} />
}

export { HomeQaTags }
