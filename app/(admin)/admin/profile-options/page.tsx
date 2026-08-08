import { ProfileOptionManager } from '@/components/admin/profile-option-manager'

export default function ProfileOptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading-3">プロフィール項目管理</h2>
        <p className="mt-1 text-paragraph-small text-muted-foreground">
          初回プロフィール登録で表示する選択肢を管理します。無効にした項目は新規登録では表示されません。
        </p>
      </div>
      <ProfileOptionManager />
    </div>
  )
}
