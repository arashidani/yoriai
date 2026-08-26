'use client'

import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { client } from '@/lib/hono/client'

type HirobaJoinDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hirobaSlug: string
  hirobaName: string
  onJoined: () => void
}

export function HirobaJoinDialog({
  open,
  onOpenChange,
  hirobaSlug,
  hirobaName,
  onJoined,
}: HirobaJoinDialogProps) {
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function join() {
    if (isJoining) return
    setIsJoining(true)
    setError(null)

    try {
      const res = await client.api.hiroba[':slug'].membership.$post({
        param: { slug: hirobaSlug },
      })
      if (!res.ok) {
        setError('ひろばに参加できませんでした。')
        return
      }
      onJoined()
      onOpenChange(false)
    } catch {
      setError('通信に失敗しました。もう一度お試しください。')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background p-6 sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-5" aria-hidden />
          </div>
          <DialogTitle className="text-heading-4">「{hirobaName}」に参加しますか？</DialogTitle>
          <DialogDescription className="text-paragraph-small">
            投稿や返信をするには、このひろばへの参加が必要です。
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-center text-paragraph-small text-destructive">
            {error}
          </p>
        )}
        <DialogFooter className="-mx-6 -mb-6 bg-background p-6">
          <DialogClose render={<Button variant="outline" disabled={isJoining} />}>
            キャンセル
          </DialogClose>
          <Button onClick={join} disabled={isJoining} className="rounded-full px-6">
            {isJoining ? '参加中...' : '参加する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
