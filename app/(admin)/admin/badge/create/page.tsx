'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { BadgeRarity } from '@/app/generated/prisma/enums'
import {
  BADGE_ICONS,
  type BadgeIconName,
  RARITY_LABELS,
  RARITY_STYLES,
} from '@/components/admin/badge-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/hono/client'
import { type CreateBadgeInput, createBadgeSchema } from '@/lib/schemas/badge'

const iconNames = Object.keys(BADGE_ICONS) as BadgeIconName[]
const rarities = [BadgeRarity.BRONZE, BadgeRarity.SILVER, BadgeRarity.GOLD, BadgeRarity.PLATINUM]

export default function CreateBadgePage() {
  const router = useRouter()
  const [selectedIcon, setSelectedIcon] = useState<BadgeIconName>(iconNames[0])
  const [selectedRarity, setSelectedRarity] = useState<BadgeRarity>(rarities[0])
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateBadgeInput>({
    resolver: zodResolver(createBadgeSchema),
    defaultValues: { icon: iconNames[0], rarity: rarities[0] },
  })
  const Icon = BADGE_ICONS[selectedIcon]
  const name = watch('name')
  const description = watch('description')

  async function onSubmit(data: CreateBadgeInput) {
    const res = await client.api.admin.badges.$post({
      json: { ...data, icon: selectedIcon, rarity: selectedRarity },
    })

    if (!res.ok) {
      const body = await res.json()
      const message =
        'error' in body && typeof body.error === 'string' ? body.error : '作成に失敗しました'
      toast.error(message)
      return
    }

    toast.success('バッジを作成しました')
    router.push('/admin/badge')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">バッジ作成</h2>
        <p className="text-sm text-muted-foreground mt-1">新しいバッジを定義します</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border p-6 space-y-5">
          <div className="space-y-2">
            <Label>アイコン</Label>
            <div className="flex gap-2 flex-wrap">
              {iconNames.map((iconName) => {
                const OptionIcon = BADGE_ICONS[iconName]
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center border transition-colors ${
                      selectedIcon === iconName
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <OptionIcon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-name">バッジ名</Label>
            <Input
              id="badge-name"
              placeholder="質問マスター"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="badge-desc">説明</Label>
            <Input
              id="badge-desc"
              placeholder="質問を50件投稿した"
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>レアリティ</Label>
            <div className="flex gap-2 flex-wrap">
              {rarities.map((rarity) => (
                <button
                  key={rarity}
                  type="button"
                  onClick={() => setSelectedRarity(rarity)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-opacity ${
                    RARITY_STYLES[rarity]
                  } ${selectedRarity === rarity ? 'opacity-100' : 'opacity-40'}`}
                >
                  {RARITY_LABELS[rarity]}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '作成中...' : 'バッジを作成'}
          </Button>
        </form>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">プレビュー</Label>
          <div className="rounded-xl border p-5 space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{name || 'バッジ名'}</h3>
              <p className="text-xs text-muted-foreground">{description || '説明'}</p>
            </div>
            <div className="pt-2 border-t">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${RARITY_STYLES[selectedRarity]}`}
              >
                {RARITY_LABELS[selectedRarity]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
