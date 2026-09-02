import Link from 'next/link'
import { AdminPostViewer } from '@/components/admin/admin-post-viewer'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminPostPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/ai-flags"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          AIフラグに戻る
        </Link>
        <h2 className="text-lg font-semibold mt-2">投稿の確認</h2>
        <p className="text-sm text-muted-foreground mt-1">
          非表示になった投稿も管理者だけが内容を確認できます
        </p>
      </div>

      <AdminPostViewer postId={id} />
    </div>
  )
}
