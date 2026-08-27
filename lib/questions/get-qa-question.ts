import { cache } from 'react'

import { createServerApiClient } from '@/lib/hono/server-client'

async function fetchQaDetail(id: string) {
  const api = await createServerApiClient()
  const response = await api.questions[':id'].$get({ param: { id } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('質問の取得に失敗しました')
  return response.json()
}

const getQaDetail = cache(fetchQaDetail)

export { getQaDetail }
