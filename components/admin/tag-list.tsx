'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Tag as TagIcon, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  useForm,
} from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { client } from '@/lib/hono/client'
import {
  type CreateTagInput,
  createTagSchema,
  type UpdateTagInput,
  updateTagSchema,
} from '@/lib/schemas/tag'

type Tag = {
  id: string
  name: string
  category: string
  description: string | null
  isWorkTag: boolean
  createdAt: Date | string
}

async function fetchTags(): Promise<Tag[]> {
  const res = await client.api.admin.tags.$get()
  if (!res.ok) throw new Error('Failed to fetch tags')
  const data = await res.json()
  return data.tags
}

function EditTagDialog({ tag, onUpdated }: { tag: Tag; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTagInput>({
    resolver: zodResolver(updateTagSchema),
    defaultValues: {
      name: tag.name,
      category: tag.category,
      description: tag.description ?? '',
      isWorkTag: tag.isWorkTag,
    },
  })

  async function onSubmit(data: UpdateTagInput) {
    const res = await client.api.admin.tags[':id'].$patch({ param: { id: tag.id }, json: data })
    if (!res.ok) {
      const body = await res.json()
      toast.error(
        'error' in body && typeof body.error === 'string' ? body.error : 'タグの更新に失敗しました',
      )
      return
    }
    setOpen(false)
    onUpdated()
    toast.success('タグを更新しました')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={`${tag.name}を編集`}>
            <Pencil />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>タグを編集</DialogTitle>
          <DialogDescription>
            カテゴリー変更が既存投稿と競合する場合は保存できません。QAを無効にすると既存QA投稿からもタグが外れます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TagFields
            register={register}
            control={control}
            errors={errors}
            prefix={`edit-${tag.id}`}
          />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type TagFieldsProps = {
  register: UseFormRegister<UpdateTagInput>
  control: Control<UpdateTagInput>
  errors: FieldErrors<UpdateTagInput>
  prefix: string
}

function TagFields({ register, control, errors, prefix }: TagFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>タグ名</Label>
        <Input id={`${prefix}-name`} {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-category`}>カテゴリー</Label>
        <Input
          id={`${prefix}-category`}
          {...register('category')}
          aria-invalid={!!errors.category}
        />
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-description`}>AI向け説明（任意）</Label>
        <Textarea
          id={`${prefix}-description`}
          {...register('description')}
          aria-invalid={!!errors.description}
          placeholder="このタグを選ぶ基準を入力"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
      <Controller
        name="isWorkTag"
        control={control}
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor={`${prefix}-work`}>QAで使用可能</Label>
              <p className="text-sm text-muted-foreground">有効なタグだけQAの候補になります。</p>
            </div>
            <Switch id={`${prefix}-work`} checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </>
  )
}

export function TagList() {
  const queryClient = useQueryClient()
  const { data: tags = [], isLoading, error } = useQuery({ queryKey: ['tags'], queryFn: fetchTags })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTagInput>({
    resolver: zodResolver(createTagSchema),
    defaultValues: { name: '', category: '', description: '', isWorkTag: false },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateTagInput) => {
      const res = await client.api.admin.tags.$post({ json: data })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(
          'error' in body && typeof body.error === 'string'
            ? body.error
            : 'タグの作成に失敗しました',
        )
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('タグを作成しました')
      reset({ name: '', category: '', description: '', isWorkTag: false })
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : '作成に失敗しました')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.admin.tags[':id'].$delete({ param: { id } })
      if (!res.ok) throw new Error('Failed to delete tag')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('タグを削除しました')
    },
    onError: () => toast.error('削除に失敗しました'),
  })

  async function onSubmit(data: CreateTagInput) {
    await createMutation.mutateAsync(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) return <div className="text-sm text-destructive">タグの取得に失敗しました</div>

  return (
    <div className="max-w-3xl space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4">
        <TagFields register={register} control={control} errors={errors} prefix="create" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '作成中...' : 'タグを追加'}
        </Button>
      </form>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだタグがありません</p>
      ) : (
        <ul className="space-y-3">
          {tags.map((tag) => (
            <li key={tag.id} className="flex items-start gap-3 rounded-lg border p-4">
              <TagIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{tag.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{tag.category}</span>
                  {tag.isWorkTag && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      QA
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tag.description || 'AI向け説明なし'}
                </p>
              </div>
              <EditTagDialog
                tag={tag}
                onUpdated={() => queryClient.invalidateQueries({ queryKey: ['tags'] })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${tag.name}を削除`}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(tag.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
