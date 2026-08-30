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
  avatarUrls: string[]
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
    setError,
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
      if (res.status === 409) setError('displayName', { type: 'server', message })
      toast.error(message)
      return
    }

    const { profile } = await res.json()
    onCreated({
      ...profile,
      isActive: profile.isActive ?? true,
      avatarUrls: profile.avatarUrls ?? [],
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
          <p className="text-sm text-muted-foreground">
            作成後にアバター画像を複数アップロードできます。並び順が #1、#2、#3… に対応します。
          </p>
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
