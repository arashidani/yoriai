'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2, UsersRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { client } from '@/lib/hono/client'
import { type CreateHirobaInput, createHirobaSchema } from '@/lib/schemas/hiroba'

type Hiroba = {
  id: string
  slug: string
  name: string
  description: string
  createdAt: Date | string
}

async function fetchHirobas(): Promise<Hiroba[]> {
  const res = await client.api.admin.hiroba.$get()
  if (!res.ok) throw new Error('Failed to fetch hirobas')
  const data = await res.json()
  return data.hirobas
}

export function HirobaList() {
  const queryClient = useQueryClient()
  const {
    data: hirobas = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['hirobas'],
    queryFn: fetchHirobas,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateHirobaInput>({ resolver: zodResolver(createHirobaSchema) })

  const createMutation = useMutation({
    mutationFn: async (data: CreateHirobaInput) => {
      const res = await client.api.admin.hiroba.$post({ json: data })
      if (!res.ok) {
        const body = await res.json()
        const message =
          'error' in body && typeof body.error === 'string'
            ? body.error
            : 'ひろばの作成に失敗しました'
        throw new Error(message)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hirobas'] })
      toast.success('ひろばを作成しました')
      reset()
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : '作成に失敗しました')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.admin.hiroba[':id'].$delete({ param: { id } })
      if (!res.ok) throw new Error('Failed to delete hiroba')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hirobas'] })
      toast.success('ひろばを削除しました')
    },
    onError: () => toast.error('削除に失敗しました'),
  })

  async function onSubmit(data: CreateHirobaInput) {
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
    return <div className="text-sm text-destructive">ひろばの取得に失敗しました</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Input
            placeholder="ひろば名（例: 広場３）"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <Input
            placeholder="説明"
            {...register('description')}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '作成中...' : 'ひろばを追加'}
        </Button>
      </form>

      {hirobas.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだひろばがありません</p>
      ) : (
        <ul className="space-y-2">
          {hirobas.map((hiroba) => (
            <li
              key={hiroba.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <UsersRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{hiroba.name}</p>
                <p className="truncate text-muted-foreground">{hiroba.description}</p>
              </div>
              <button
                type="button"
                aria-label={`${hiroba.name}を削除`}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(hiroba.id)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
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
