import { TagList } from '@/components/admin/tag-list'

export const dynamic = 'force-dynamic'

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">タグ管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          投稿にAIが自動付与するタグの一覧。ユーザー自身はタグを付与・変更できません。
        </p>
      </div>

      <TagList />
    </div>
  )
}
