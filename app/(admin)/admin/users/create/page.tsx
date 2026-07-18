import { CreateInviteDialog } from '@/components/admin/create-invite-dialog'
import { MOCK_INVITES } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  PENDING: '未使用',
  USED: '使用済み',
  EXPIRED: '期限切れ',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-primary/10 text-primary',
  USED: 'bg-muted text-muted-foreground',
  EXPIRED: 'bg-destructive/10 text-destructive',
}

function inviteStatus(invite: { usedAt: Date | null; expiresAt: Date }) {
  if (invite.usedAt) return 'USED'
  if (invite.expiresAt < new Date()) return 'EXPIRED'
  return 'PENDING'
}

async function getInvites() {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_INVITES.map((i) => ({ ...i, status: inviteStatus(i) }))
  }
  const invites = await prisma.invite.findMany({ orderBy: { createdAt: 'desc' } })
  return invites.map((i) => ({ ...i, status: inviteStatus(i) }))
}

export default async function CreateUserPage() {
  const invites = await getInvites()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ユーザー作成</h2>
          <p className="text-sm text-muted-foreground mt-1">
            招待リンクを発行して新しいユーザーを招待します
          </p>
        </div>
        <CreateInviteDialog />
      </div>

      {invites.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだ招待がありません</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">名前（仮）</th>
                <th className="px-5 py-3 font-medium">ユーザー権限</th>
                <th className="px-5 py-3 font-medium">状態</th>
                <th className="px-5 py-3 font-medium">有効期限</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invites.map((invite) => (
                <tr key={invite.id}>
                  <td className="px-5 py-3">{invite.name ?? '—'}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {invite.role === 'ADMIN' ? '管理者' : '一般ユーザー'}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[invite.status]}`}
                    >
                      {STATUS_LABELS[invite.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(invite.expiresAt).toLocaleString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
