import { TagCategoryList } from '@/components/admin/tag-category-list'

export const dynamic = 'force-dynamic'

export default function TagCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">タグカテゴリー管理</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          タグ作成・編集時に選択できるカテゴリーを追加・削除します。
        </p>
      </div>
      <TagCategoryList />
    </div>
  )
}
