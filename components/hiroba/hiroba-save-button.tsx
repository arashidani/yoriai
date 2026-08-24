'use client'

import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useDebouncedOptimisticToggle } from '@/hooks/use-debounced-optimistic-toggle'
import { client } from '@/lib/hono/client'
import { cn } from '@/lib/utils'

type HirobaSaveButtonProps = {
  postId: string
  initialSaved: boolean
}

export function HirobaSaveButton({ postId, initialSaved }: HirobaSaveButtonProps) {
  const { pressed: saved, toggle } = useDebouncedOptimisticToggle({
    initialPressed: initialSaved,
    onSync: async (next) => {
      const res = next
        ? await client.api['hiroba-posts'][':id'].bookmarks.$post({ param: { id: postId } })
        : await client.api['hiroba-posts'][':id'].bookmarks.$delete({ param: { id: postId } })
      if (!res.ok) throw new Error('保存の処理に失敗しました')
      return res.json()
    },
    parseResult: (result) => ({ pressed: result.saved }),
    onError: () => toast.error('保存の処理に失敗しました'),
  })

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggle()
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
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
