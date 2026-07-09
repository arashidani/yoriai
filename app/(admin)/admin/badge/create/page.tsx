'use client'

import { useState } from 'react'
import { Medal, Award, Crown, Sparkles, Star, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const icons = [Medal, Award, Crown, Sparkles, Star, Trophy]
const rarities = [
  { label: 'ブロンズ', style: 'bg-amber-700/10 text-amber-700' },
  { label: 'シルバー', style: 'bg-slate-400/10 text-slate-500' },
  { label: 'ゴールド', style: 'bg-yellow-500/10 text-yellow-600' },
  { label: 'プラチナ', style: 'bg-violet-500/10 text-violet-600' },
]

export default function CreateBadgePage() {
  const [selectedIcon, setSelectedIcon] = useState(0)
  const [selectedRarity, setSelectedRarity] = useState(0)
  const Icon = icons[selectedIcon]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">バッジ作成</h2>
        <p className="text-sm text-muted-foreground mt-1">新しいバッジを定義します</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
        <div className="rounded-xl border p-6 space-y-5">
          <div className="space-y-2">
            <Label>アイコン</Label>
            <div className="flex gap-2 flex-wrap">
              {icons.map((I, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIcon(i)}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center border transition-colors ${
                    selectedIcon === i ? 'bg-primary/10 border-primary text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <I className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-name">バッジ名</Label>
            <Input id="badge-name" placeholder="質問マスター" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="badge-desc">説明</Label>
            <Input id="badge-desc" placeholder="質問を50件投稿した" disabled />
          </div>
          <div className="space-y-2">
            <Label>レアリティ</Label>
            <div className="flex gap-2 flex-wrap">
              {rarities.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setSelectedRarity(i)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-opacity ${r.style} ${
                    selectedRarity === i ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled>バッジを作成</Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">プレビュー</Label>
          <div className="rounded-xl border p-5 space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">質問マスター</h3>
              <p className="text-xs text-muted-foreground">質問を50件投稿した</p>
            </div>
            <div className="pt-2 border-t">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rarities[selectedRarity].style}`}>
                {rarities[selectedRarity].label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}