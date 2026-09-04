import { NotFoundContent } from '@/components/layout/not-found-content'

/**
 * ユーザー画面配下で notFound() が呼ばれたときの404。
 * ナビゲーションとmainはUserLayoutが描画するため、本文だけを返す。
 */
export default function UserNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <NotFoundContent />
    </div>
  )
}
