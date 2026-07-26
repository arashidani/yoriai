'use client'

import { Bookmark } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/hono/client'
import { cn } from '@/lib/utils'

type SaveButtonProps = {
  postId: string
  initialSaved: boolean
}

export function SaveButton({ postId, initialSaved }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [pending, setPending] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (pending) return

    const next = !saved
    setPending(true)
    setSaved(next)

    const res = next
      ? await client.api.posts[':id'].bookmarks.$post({ param: { id: postId } })
      : await client.api.posts[':id'].bookmarks.$delete({ param: { id: postId } })

    setPending(false)

    if (!res.ok) {
      setSaved(!next)
      toast.error('保存の処理に失敗しました')
      return
    }
    const body = await res.json()
    setSaved(body.saved)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        'gap-1.5 rounded-full border border-input px-3 text-paragraph-mini font-medium',
        saved && 'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
      )}
    >
      <Bookmark className={cn('size-3', saved && 'fill-current')} />
      {saved ? '保存済み' : '保存'}
    </Button>
  )
}
