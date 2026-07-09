import { Award, Medal, Crown, Sparkles } from 'lucide-react'

const rarityStyles: Record<string, string> = {
  ブロンズ: 'bg-amber-700/10 text-amber-700',
  シルバー: 'bg-slate-400/10 text-slate-500',
  ゴールド: 'bg-yellow-500/10 text-yellow-600',
  プラチナ: 'bg-violet-500/10 text-violet-600',
}

const badges = [
  { icon: Medal, name: '初投稿', desc: '初めて投稿を作成した', rarity: 'ブロンズ', earned: 842 },
  { icon: Award, name: '質問マスター', desc: '質問を50件投稿した', rarity: 'シルバー', earned: 213 },
  { icon: Crown, name: 'ベストアンサー王', desc: 'ベストアンサーを100件獲得した', rarity: 'ゴールド', earned: 34 },
  { icon: Sparkles, name: '伝説の回答者', desc: '累計いいねを1000件獲得した', rarity: 'プラチナ', earned: 5 },
]

export default function BadgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">バッジ管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          ユーザーの行動に応じて付与されるバッジの一覧
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {badges.map((b) => (
          <div key={b.name} className="rounded-xl border p-5 space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <b.icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">{b.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rarityStyles[b.rarity]}`}>
                {b.rarity}
              </span>
              <span className="text-xs text-muted-foreground">{b.earned}人が獲得</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}