'use client'

import { useState } from 'react'
import { Target, Calendar, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const durations = ['1日間', '3日間', '1週間', '1ヶ月']

export default function CreateMissionPage() {
  const [selectedDuration, setSelectedDuration] = useState(2)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ミッション作成</h2>
        <p className="text-sm text-muted-foreground mt-1">新しい達成課題を設定します</p>
      </div>

      <div className="max-w-lg rounded-xl border p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
          <Target className="h-4 w-4" />
          ミッション内容
        </div>

        <div className="space-y-2">
          <Label htmlFor="mission-name">ミッション名</Label>
          <Input id="mission-name" placeholder="週に5件投稿" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mission-desc">説明</Label>
          <Input id="mission-desc" placeholder="1週間で5件の投稿を作成する" disabled />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            期間
          </Label>
          <div className="flex gap-2 flex-wrap">
            {durations.map((d, i) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(i)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  selectedDuration === i ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}
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
          <Input id="mission-target" type="number" placeholder="5" disabled />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" />
            報酬バッジ
          </Label>
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground text-center">
            バッジを選択（未設定）
          </div>
        </div>

        <Button className="w-full" disabled>ミッションを作成</Button>
      </div>
    </div>
  )
}