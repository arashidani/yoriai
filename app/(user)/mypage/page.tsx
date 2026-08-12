import { ProfileForm } from '@/components/mypage/profile-form'

export default function MyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8 lg:p-12">
      <header className="space-y-2">
        <h1 className="text-heading-2">マイページ</h1>
        <p className="text-paragraph text-muted-foreground">
          登録したプロフィール情報を確認・変更できます。
        </p>
      </header>
      <ProfileForm />
    </div>
  )
}
