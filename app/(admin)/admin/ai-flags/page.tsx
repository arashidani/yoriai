import { AiFlagList } from '@/components/admin/ai-flag-list'

export default function AiFlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AIフラグ</h2>
        <p className="text-sm text-muted-foreground mt-1">AIが検出した不審なアクティビティ</p>
      </div>

      <AiFlagList />
    </div>
  )
}
