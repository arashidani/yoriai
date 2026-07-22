'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import {
  type CreateAnonymousProfileInput,
  createAnonymousProfileSchema,
} from '@/lib/schemas/anonymous-profile'

type AnonymousProfile = {
  id: string
  displayName: string
  avatarUrl: string
  isActive: boolean
  createdAt: Date | string
}

type CreateAnonymousProfileDialogProps = {
  onCreated: (profile: AnonymousProfile) => void
}

export function CreateAnonymousProfileDialog({ onCreated }: CreateAnonymousProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAnonymousProfileInput>({
    resolver: zodResolver(createAnonymousProfileSchema),
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) reset()
  }

  async function onSubmit(data: CreateAnonymousProfileInput) {
    const res = await client.api.admin['anonymous-profiles'].$post({ json: data })

    if (!res.ok) {
      const body = await res.json()
      const message =
        'error' in body && typeof body.error === 'string' ? body.error : '追加に失敗しました'
      toast.error(message)
      return
    }

    const { profile } = await res.json()
    onCreated({
      ...profile,
      isActive: profile.isActive ?? true,
      createdAt: profile.createdAt ?? new Date(),
    })
    toast.success('匿名キャラを追加しました')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus />
            匿名キャラを追加
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>匿名キャラを追加</DialogTitle>
          <DialogDescription>
            質問スレッドで割り当てる匿名キャラの候補を追加します。追加直後は有効な状態で作成されます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="anon-display-name">表示名</Label>
            <Input
              id="anon-display-name"
              placeholder="うさぎ"
              {...register('displayName')}
              aria-invalid={!!errors.displayName}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="anon-avatar-url">アイコンURL</Label>
            <Input
              id="anon-avatar-url"
              placeholder="/anonymous-profiles/rabbit.svg"
              {...register('avatarUrl')}
              aria-invalid={!!errors.avatarUrl}
            />
            {errors.avatarUrl && (
              <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '追加中...' : '追加する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
