'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Gift, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/hono/client'
import { type CreateMissionInput, createMissionSchema } from '@/lib/schemas/mission'
import { cn } from '@/lib/utils'

const durations = ['1日間', '3日間', '1週間', '1ヶ月']

type BadgeOption = { id: string; name: string }

export default function CreateMissionPage() {
  const router = useRouter()
  const [badges, setBadges] = useState<BadgeOption[]>([])
  const [selectedDuration, setSelectedDuration] = useState(durations[2])
  const [rewardBadgeId, setRewardBadgeId] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMissionInput>({
    resolver: zodResolver(createMissionSchema),
  })

  useEffect(() => {
    client.api.admin.badges.$get().then(async (res) => {
      if (!res.ok) return
      const { badges } = await res.json()
      setBadges(badges)
    })
  }, [])

  async function onSubmit(data: CreateMissionInput) {
    const res = await client.api.admin.missions.$post({
      json: { ...data, durationLabel: selectedDuration, rewardBadgeId },
    })

    if (!res.ok) {
      const body = await res.json()
      const message =
        'error' in body && typeof body.error === 'string' ? body.error : '作成に失敗しました'
      toast.error(message)
      return
    }

    toast.success('ミッションを作成しました')
    router.push('/admin/mission')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ミッション作成</h2>
        <p className="text-sm text-muted-foreground mt-1">新しい達成課題を設定します</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg rounded-xl border p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
          <Target className="h-4 w-4" />
          ミッション内容
        </div>

        <div className="space-y-2">
          <Label htmlFor="mission-name">ミッション名</Label>
          <Input
            id="mission-name"
            placeholder="週に5件投稿"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mission-desc">説明</Label>
          <Input
            id="mission-desc"
            placeholder="1週間で5件の投稿を作成する"
            {...register('description')}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            期間
          </Label>
          <div className="flex gap-2 flex-wrap">
            {durations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDuration(d)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
                  selectedDuration === d
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mission-target" className="flex items-center gap-1.5">
            達成条件（件数）
          </Label>
          <Input
            id="mission-target"
            type="number"
            placeholder="5"
            {...register('targetCount', { valueAsNumber: true })}
            aria-invalid={!!errors.targetCount}
          />
          {errors.targetCount && (
            <p className="text-sm text-destructive">{errors.targetCount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" />
            報酬バッジ
          </Label>
          {badges.length === 0 ? (
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground text-center">
              バッジがありません
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setRewardBadgeId(null)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-opacity ${
                  rewardBadgeId === null ? 'bg-muted opacity-100' : 'bg-muted opacity-40'
                }`}
              >
                未設定
              </button>
              {badges.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setRewardBadgeId(b.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-opacity ${
                    rewardBadgeId === b.id
                      ? 'bg-primary/10 text-primary opacity-100'
                      : 'bg-primary/10 text-primary opacity-40'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '作成中...' : 'ミッションを作成'}
        </Button>
      </form>
    </div>
  )
}
