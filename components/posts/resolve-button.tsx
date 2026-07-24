'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/hono/client'

type ResolveButtonProps = {
  postId: string
}

export function ResolveButton({ postId }: ResolveButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    const res = await client.api.posts[':id'].resolve.$post({ param: { id: postId } })
    setPending(false)

    if (!res.ok) {
      toast.error('解決済みへの変更に失敗しました')
      return
    }
    toast.success('質問を解決済みにしました')
    router.refresh()
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      <CheckCircle2 />
      {pending ? '処理中...' : '解決済みにする'}
    </Button>
  )
}
