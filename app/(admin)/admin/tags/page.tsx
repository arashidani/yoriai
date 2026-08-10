import { TagList } from '@/components/admin/tag-list'

export const dynamic = 'force-dynamic'

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">タグ管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AIが投稿へ自動付与するタグを管理します。QAでは「QAで使用可能」のタグだけが候補になります。
        </p>
      </div>

      <TagList />
    </div>
  )
}
