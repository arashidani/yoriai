import completeRightImage from '@/assets/register-complete-right.png'
import { Button } from '@/components/design-system/button'
import { RegisterImagePanel } from '@/components/register/register-image-panel'
import { RegisterSidePanel } from '@/components/register/register-side-panel'

export default function CompletePage() {
  return (
    <div className="relative flex h-screen items-center justify-center bg-background-subtle">
      <RegisterImagePanel image={completeRightImage} />

      <RegisterSidePanel className="gap-16">
        <div className="flex flex-col gap-4 items-center">
          <p className="text-foreground text-heading-1">登録が完了しました！</p>

          <p className="text-secondary-foreground text-center">
            次は、あなたのことを知ってもらうために
            <br />
            プロフィールを設定しましょう
          </p>
        </div>

        <Button className="w-95">プロフィール設定に進む</Button>
      </RegisterSidePanel>
    </div>
  )
}
