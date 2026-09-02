'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { client } from '@/lib/hono/client'
import {
  type CreateProfileOptionInput,
  createProfileOptionSchema,
  type ProfileOptionCategory,
} from '@/lib/schemas/onboarding'

type ProfileOption = {
  id: string
  name: string
  isActive: boolean
  sortOrder: number
  createdAt: Date | string
  updatedAt: Date | string
}

const categories: { category: ProfileOptionCategory; title: string; description: string }[] = [
  { category: 'departments', title: '所属部署', description: 'ユーザーが所属する部署です。' },
  {
    category: 'business-areas',
    title: '業務エリア',
    description: 'ユーザーの担当業務エリアです。',
  },
  {
    category: 'business-skills',
    title: 'ビジネススキル',
    description: 'ユーザーが複数選択できるスキルです。',
  },
  {
    category: 'interests',
    title: '興味',
    description: 'ユーザーが複数選択できる興味分野です。',
  },
]

async function fetchOptions(category: ProfileOptionCategory): Promise<ProfileOption[]> {
  const res = await client.api.admin['profile-options'][':category'].$get({ param: { category } })
  if (!res.ok) throw new Error('項目の取得に失敗しました')
  return (await res.json()).options
}

function OptionRow({
  category,
  option,
  isFirst,
  isLast,
  isReordering,
  onMove,
}: {
  category: ProfileOptionCategory
  option: ProfileOption
  isFirst: boolean
  isLast: boolean
  isReordering: boolean
  onMove: (offset: -1 | 1) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(option.name)
  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; isActive?: boolean }) => {
      const res = await client.api.admin['profile-options'][':category'][':id'].$patch({
        param: { category, id: option.id },
        json: data,
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error('error' in body ? body.error : '項目の更新に失敗しました')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-options', category] })
      toast.success('項目を更新しました')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '更新に失敗しました'),
  })

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-input p-4 sm:flex-row sm:items-center">
      <div className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={isFirst || isReordering}
          onClick={() => onMove(-1)}
          aria-label={`${option.name}を上へ移動`}
        >
          <ArrowUp />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={isLast || isReordering}
          onClick={() => onMove(1)}
          aria-label={`${option.name}を下へ移動`}
        >
          <ArrowDown />
        </Button>
      </div>
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-label={`${option.name}の項目名`}
        className="flex-1"
      />
      <div className="flex items-center gap-3">
        <label
          htmlFor={`profile-option-active-${option.id}`}
          className="flex items-center gap-2 text-paragraph-small"
        >
          <Switch
            id={`profile-option-active-${option.id}`}
            checked={option.isActive}
            disabled={updateMutation.isPending}
            onCheckedChange={(isActive) => updateMutation.mutate({ isActive })}
            aria-label={`${option.name}を有効にする`}
          />
          {option.isActive ? '有効' : '無効'}
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={updateMutation.isPending || name.trim() === option.name || !name.trim()}
          onClick={() => updateMutation.mutate({ name: name.trim() })}
        >
          保存
        </Button>
      </div>
    </li>
  )
}

function ProfileOptionSection({ category, title, description }: (typeof categories)[number]) {
  const queryClient = useQueryClient()
  const {
    data: options = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile-options', category],
    queryFn: () => fetchOptions(category),
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProfileOptionInput>({ resolver: zodResolver(createProfileOptionSchema) })
  const createMutation = useMutation({
    mutationFn: async (data: CreateProfileOptionInput) => {
      const res = await client.api.admin['profile-options'][':category'].$post({
        param: { category },
        json: data,
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error('error' in body ? body.error : '項目の追加に失敗しました')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-options', category] })
      toast.success('項目を追加しました')
      reset()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '追加に失敗しました'),
  })
  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await client.api.admin['profile-options'][':category'].order.$put({
        param: { category },
        json: { orderedIds },
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error('error' in body ? body.error : '並び順の更新に失敗しました')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-options', category] })
      toast.success('並び順を更新しました')
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : '並び順の更新に失敗しました'),
  })

  const moveOption = (index: number, offset: -1 | 1) => {
    const orderedIds = options.map(({ id }) => id)
    const targetIndex = index + offset
    const targetId = orderedIds[targetIndex]
    orderedIds[targetIndex] = orderedIds[index]
    orderedIds[index] = targetId
    reorderMutation.mutate(orderedIds)
  }

  return (
    <section className="space-y-4 rounded-xl border border-input bg-card p-6">
      <div>
        <h3 className="text-heading-4">{title}</h3>
        <p className="text-paragraph-small text-muted-foreground">{description}</p>
      </div>
      <form
        onSubmit={handleSubmit((data) => createMutation.mutateAsync(data))}
        className="flex items-start gap-2"
      >
        <div className="flex-1">
          <Input
            placeholder={`${title}を追加`}
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          追加
        </Button>
      </form>
      {isLoading ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="読み込み中" />
      ) : error ? (
        <p className="text-sm text-destructive">項目の取得に失敗しました</p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">項目がありません</p>
      ) : (
        <ul className="space-y-2">
          {options.map((option, index) => (
            <OptionRow
              key={option.id}
              category={category}
              option={option}
              isFirst={index === 0}
              isLast={index === options.length - 1}
              isReordering={reorderMutation.isPending}
              onMove={(offset) => moveOption(index, offset)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export function ProfileOptionManager() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {categories.map((category) => (
        <ProfileOptionSection key={category.category} {...category} />
      ))}
    </div>
  )
}
