import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ユーザー作成</h2>
        <p className="text-sm text-muted-foreground mt-1">新しいユーザーを追加します</p>
      </div>

      <div className="max-w-lg rounded-xl border p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
          <UserPlus className="h-4 w-4" />
          基本情報
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">名前</Label>
          <Input id="name" placeholder="山田 太郎" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input id="email" type="email" placeholder="taro@example.com" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">初期パスワード</Label>
          <Input id="password" type="password" placeholder="••••••••" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">ロール</Label>
          <div className="flex gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">一般ユーザー</span>
            <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">管理者</span>
          </div>
        </div>

        <Button className="w-full" disabled>ユーザーを作成</Button>
      </div>
    </div>
  )
}