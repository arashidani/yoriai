import { Target, CheckCircle2, Flag } from 'lucide-react'

const missions = [
  { name: '3日連続ログイン', desc: '3日間連続でログインする', progress: 100, participants: 421, active: true },
  { name: '週に5件投稿', desc: '1週間で5件の投稿を作成する', progress: 62, participants: 189, active: true },
  { name: 'コメントを10件つける', desc: '他のユーザーの投稿にコメントする', progress: 34, participants: 97, active: true },
  { name: '月間トップ回答者', desc: '月内で最も多くベストアンサーを獲得する', progress: 8, participants: 26, active: false },
]

export default function MissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ミッション管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          ユーザーの継続的な参加を促す達成課題の一覧
        </p>
      </div>

      <div className="space-y-3 max-w-2xl">
        {missions.map((m) => (
          <div key={m.name} className="rounded-xl border p-5 space-y-3">
            <div className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-medium">{m.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {m.active ? '実施中' : '停止中'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Flag className="h-3.5 w-3.5" />
                {m.participants}人が挑戦中
              </div>
            </div>
            <div className="flex items-center gap-3 pl-13">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${m.progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right flex items-center gap-1">
                {m.progress === 100 && <CheckCircle2 className="h-3 w-3" />}
                {m.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}