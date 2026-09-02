'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Loader2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { client } from '@/lib/hono/client'
import { type CreateTagCategoryInput, createTagCategorySchema } from '@/lib/schemas/tag-category'

export type TagCategory = {
  id: string
  name: string
  createdAt: Date | string
}

export async function fetchTagCategories(): Promise<TagCategory[]> {
  const res = await client.api.admin['tag-categories'].$get()
  if (!res.ok) throw new Error('Failed to fetch tag categories')
  const data = await res.json()
  return data.categories
}

export function TagCategoryList() {
  const queryClient = useQueryClient()
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tagCategories'],
    queryFn: fetchTagCategories,
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTagCategoryInput>({ resolver: zodResolver(createTagCategorySchema) })

  const createMutation = useMutation({
    mutationFn: async (data: CreateTagCategoryInput) => {
      const res = await client.api.admin['tag-categories'].$post({ json: data })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(
          'error' in body && typeof body.error === 'string'
            ? body.error
            : 'カテゴリーの作成に失敗しました',
        )
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagCategories'] })
      toast.success('カテゴリーを作成しました')
      reset()
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : '作成に失敗しました')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.admin['tag-categories'][':id'].$delete({ param: { id } })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(
          'error' in body && typeof body.error === 'string'
            ? body.error
            : 'カテゴリーの削除に失敗しました',
        )
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagCategories'] })
      toast.success('カテゴリーを削除しました')
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : '削除に失敗しました')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">カテゴリーの取得に失敗しました</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form
        onSubmit={handleSubmit((data) => createMutation.mutateAsync(data))}
        className="flex items-start gap-2"
      >
        <div className="flex-1">
          <Input
            placeholder="新しいカテゴリー名（例: 人事）"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '作成中...' : 'カテゴリーを追加'}
        </Button>
      </form>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだカテゴリーがありません</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 rounded-lg border p-3">
              <FolderTree className="size-4 text-muted-foreground" />
              <span className="flex-1 font-medium">{category.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${category.name}を削除`}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(category.id)}
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
