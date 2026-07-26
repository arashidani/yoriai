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

type DeleteAnonymousProfileButtonProps = {
  profileId: string
  displayName: string
  onDeleted: (profileId: string) => void
}

export function DeleteAnonymousProfileButton({
  profileId,
  displayName,
  onDeleted,
}: DeleteAnonymousProfileButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    const res = await client.api.admin['anonymous-profiles'][':id'].$delete({
      param: { id: profileId },
    })
    setPending(false)
    setOpen(false)

    if (!res.ok) {
      const body = await res.json()
      const message =
        'error' in body && typeof body.error === 'string' ? body.error : '削除に失敗しました'
      toast.error(message)
      return
    }
    onDeleted(profileId)
    toast.success('匿名キャラを削除しました')
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="匿名キャラを削除">
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>匿名キャラを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{displayName}
            」を削除します。すでにいずれかの質問スレッドで使われている場合は削除できません（先に無効化してください）。
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
