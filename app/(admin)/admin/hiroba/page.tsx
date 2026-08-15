import { HirobaList } from '@/components/admin/hiroba-list'

export const dynamic = 'force-dynamic'

export default function AdminHirobaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ひろば管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          ひろば（サブフォーラム）の作成・削除。削除すると配下の投稿・回答もすべて削除されます。
        </p>
      </div>

      <HirobaList />
    </div>
  )
}
