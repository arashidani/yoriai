'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { client } from '@/lib/hono/client'

type DeletePostButtonProps = {
  postId: string
  postTitle: string
  onDeleted: (postId: string) => void
}

export function DeletePostButton({ postId, postTitle, onDeleted }: DeletePostButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    const res = await client.api.posts[':id'].$delete({ param: { id: postId } })
    setPending(false)
    setOpen(false)

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(data && 'error' in data ? data.error : '削除に失敗しました')
      return
    }
    onDeleted(postId)
    toast.success('投稿を削除しました')
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="投稿を削除"
            className="bg-background/90 shadow-sm hover:bg-background"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>投稿を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{postTitle}」を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
