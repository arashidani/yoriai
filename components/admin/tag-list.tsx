'use client'

import { Select } from '@base-ui/react/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2, Pencil, Tag as TagIcon } from 'lucide-react'
import { useState } from 'react'
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete-button'
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
import { Textarea } from '@/components/ui/textarea'
import { client } from '@/lib/hono/client'
import {
  type CreateTagInput,
  createTagSchema,
  type UpdateTagInput,
  updateTagSchema,
} from '@/lib/schemas/tag'
import { fetchTagCategories, type TagCategory } from './tag-category-list'

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

function EditTagDialog({
  tag,
  categories,
  onUpdated,
}: {
  tag: Tag
  categories: TagCategory[]
  onUpdated: () => void
}) {
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
            categories={categories}
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
  categories: TagCategory[]
  prefix: string
}

function CategorySelect({
  id,
  value,
  categories,
  invalid,
  onChange,
}: {
  id: string
  value: string
  categories: TagCategory[]
  invalid: boolean
  onChange: (value: string) => void
}) {
  const items = categories.map(({ name }) => ({ label: name, value: name }))

  return (
    <Select.Root
      items={items}
      value={value || null}
      onValueChange={(nextValue) => onChange(nextValue ?? '')}
    >
      <Select.Trigger
        id={id}
        aria-invalid={invalid}
        disabled={categories.length === 0}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Select.Value
          className="data-placeholder:text-muted-foreground"
          placeholder={
            categories.length === 0 ? 'カテゴリーを先に作成してください' : '選択してください'
          }
        />
        <Select.Icon>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50 outline-hidden" sideOffset={4}>
          <Select.Popup className="min-w-(--anchor-width) origin-(--transform-origin) rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Select.List>
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1.5 pr-3 pl-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <Select.ItemIndicator>
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

function TagFields({ register, control, errors, categories, prefix }: TagFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>タグ名</Label>
        <Input id={`${prefix}-name`} {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-category`}>カテゴリー</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategorySelect
              id={`${prefix}-category`}
              value={field.value}
              categories={categories}
              invalid={!!errors.category}
              onChange={field.onChange}
            />
          )}
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
    </>
  )
}

export function TagList() {
  const queryClient = useQueryClient()
  const {
    data: tags = [],
    isLoading: tagsLoading,
    error: tagsError,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  })
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({ queryKey: ['tagCategories'], queryFn: fetchTagCategories })

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

  if (tagsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (tagsError || categoriesError) {
    return <div className="text-sm text-destructive">タグ情報の取得に失敗しました</div>
  }

  return (
    <div className="max-w-3xl space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4">
        <TagFields
          register={register}
          control={control}
          errors={errors}
          categories={categories}
          prefix="create"
        />
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
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tag.description || 'AI向け説明なし'}
                </p>
              </div>
              <EditTagDialog
                tag={tag}
                categories={categories}
                onUpdated={() => queryClient.invalidateQueries({ queryKey: ['tags'] })}
              />
              <ConfirmDeleteButton
                triggerLabel={`${tag.name}を削除`}
                title="タグを削除しますか？"
                description={`「${tag.name}」を削除します。このタグが付いている投稿からもタグが外れます。この操作は取り消せません。`}
                disabled={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutateAsync(tag.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
