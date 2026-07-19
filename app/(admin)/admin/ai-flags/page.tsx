'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { AiFlagList } from '@/components/admin/ai-flag-list'
import { client } from '@/lib/hono/client'

async function fetchFlags() {
  const res = await client.api.admin['ai-flags'].$get()
  if (!res.ok) throw new Error('Failed to fetch flags')
  const data = await res.json()
  return data.flags.map((flag) => ({
    ...flag,
    targetUser: flag.targetUser ?? null,
    post: flag.post ?? null,
  }))
}

export default function AiFlagsPage() {
  const {
    data: flags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['aiFlags'],
    queryFn: fetchFlags,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">AIフラグの取得に失敗しました</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AIフラグ</h2>
        <p className="text-sm text-muted-foreground mt-1">AIが検出した不審なアクティビティ</p>
      </div>

      <AiFlagList flags={flags} />
    </div>
  )
}
