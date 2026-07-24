'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Tag as TagIcon, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { client } from '@/lib/hono/client'
import { type CreateTagInput, createTagSchema } from '@/lib/schemas/tag'

type Tag = {
  id: string
  name: string
  createdAt: Date | string
}

async function fetchTags(): Promise<Tag[]> {
  const res = await client.api.admin.tags.$get()
  if (!res.ok) throw new Error('Failed to fetch tags')
  const data = await res.json()
  return data.tags
}

export function TagList() {
  const queryClient = useQueryClient()
  const {
    data: tags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTagInput>({ resolver: zodResolver(createTagSchema) })

  const createMutation = useMutation({
    mutationFn: async (data: CreateTagInput) => {
      const res = await client.api.admin.tags.$post({ json: data })
      if (!res.ok) {
        const body = await res.json()
        const message =
          'error' in body && typeof body.error === 'string'
            ? body.error
            : 'タグの作成に失敗しました'
        throw new Error(message)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('タグを作成しました')
      reset()
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

  if (error) {
    return <div className="text-sm text-destructive">タグの取得に失敗しました</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            placeholder="新しいタグ名（例: 経理）"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '作成中...' : 'タグを追加'}
        </Button>
      </form>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだタグがありません</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
            >
              <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {tag.name}
              <button
                type="button"
                aria-label={`${tag.name}を削除`}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(tag.id)}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
