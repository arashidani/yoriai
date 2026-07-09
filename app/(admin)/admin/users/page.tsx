import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

const users = [
  { name: '田中 陽子', email: 'tanaka@example.com', role: 'USER', createdAt: '2025-11-02' },
  { name: '佐藤 健', email: 'sato@example.com', role: 'ADMIN', createdAt: '2025-09-14' },
  { name: '山本 直樹', email: 'yamamoto@example.com', role: 'USER', createdAt: '2026-01-20' },
  { name: '鈴木 美咲', email: 'suzuki@example.com', role: 'USER', createdAt: '2026-03-05' },
]

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN'
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}
    >
      {isAdmin ? '管理者' : '一般ユーザー'}
    </span>
  )
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ユーザー管理</h2>
          <p className="text-sm text-muted-foreground mt-1">登録済みユーザーの一覧</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="名前またはメールで検索" className="pl-9" disabled />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">名前</th>
              <th className="px-5 py-3 font-medium">メールアドレス</th>
              <th className="px-5 py-3 font-medium">ユーザー権限</th>
              <th className="px-5 py-3 font-medium">登録日</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.email}>
                <td className="px-5 py-3">{u.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-5 py-3 text-muted-foreground">{u.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}