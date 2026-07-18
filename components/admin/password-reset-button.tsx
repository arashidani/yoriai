'use client'

import { Check, Copy, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/hono/client'

type PasswordResetButtonProps = {
  userId: string
  userName: string | null
}

export function PasswordResetButton({ userId, userName }: PasswordResetButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setResetLink(null)
      setCopied(false)
      void handleGenerate()
    }
  }

  async function handleGenerate() {
    setPending(true)
    const res = await client.api.admin.users[':id']['password-resets'].$post({
      param: { id: userId },
    })
    setPending(false)

    if (!res.ok) {
      toast.error('リンクの発行に失敗しました')
      setOpen(false)
      return
    }

    const { passwordReset } = await res.json()
    setResetLink(`${window.location.origin}/reset-password?token=${passwordReset.token}`)
  }

  async function handleCopy() {
    if (!resetLink) return
    await navigator.clipboard.writeText(resetLink)
    setCopied(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="パスワードリセットリンクを発行">
            <KeyRound />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>パスワードリセットリンクを発行</DialogTitle>
          <DialogDescription>
            {userName ?? 'このユーザー'}に共有してください。1回のみ使用可能です。
          </DialogDescription>
        </DialogHeader>

        {pending ? (
          <p className="text-sm text-muted-foreground">発行中...</p>
        ) : resetLink ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              リセットリンク（24時間有効・1回のみ使用可能）
            </Label>
            <div className="flex gap-2">
              <Input readOnly value={resetLink} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
