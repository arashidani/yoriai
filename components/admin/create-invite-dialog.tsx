'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Role } from '@/app/generated/prisma/enums'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/hono/client'
import { type CreateInviteInput, createInviteSchema } from '@/lib/schemas/invite'
import { cn } from '@/lib/utils'

export function CreateInviteDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>(Role.USER)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInviteInput>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: { role: Role.USER },
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      reset({ role: Role.USER })
      setRole(Role.USER)
      setInviteLink(null)
      setCopied(false)
    } else if (inviteLink) {
      router.refresh()
    }
  }

  async function onSubmit(data: CreateInviteInput) {
    const res = await client.api.admin.invites.$post({ json: { ...data, role } })

    if (!res.ok) {
      const body = await res.json()
      const message =
        'error' in body && typeof body.error === 'string' ? body.error : '作成に失敗しました'
      toast.error(message)
      return
    }

    const { invite } = await res.json()
    setInviteLink(`${window.location.origin}/register?token=${invite.token}`)
    toast.success('招待リンクを発行しました')
  }

  async function handleCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus />
            招待リンクを作成
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>招待リンクを発行</DialogTitle>
          <DialogDescription>
            リンクを開いた本人がメールアドレスとパスワードを設定して登録を完了します。
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              招待リンク（7日間有効・1回のみ使用可能）
            </Label>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="invite-name">名前（仮）</Label>
              <Input
                id="invite-name"
                placeholder="山田 太郎"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">ユーザー権限</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole(Role.USER)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium transition-opacity',
                    role === Role.USER ? 'opacity-100' : 'opacity-40',
                  )}
                >
                  一般ユーザー
                </button>
                <button
                  type="button"
                  onClick={() => setRole(Role.ADMIN)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium transition-opacity',
                    role === Role.ADMIN ? 'opacity-100' : 'opacity-40',
                  )}
                >
                  管理者
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '発行中...' : '発行する'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
