import { CreateInviteDialog } from '@/components/admin/create-invite-dialog'
import { InviteTable } from '@/components/admin/invite-table'
import { MOCK_INVITES } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

function inviteStatus(invite: {
  usedAt: Date | null
  expiresAt: Date
}): 'USED' | 'EXPIRED' | 'PENDING' {
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
  const serializedInvites = invites.map((invite) => ({
    id: invite.id,
    token: invite.token,
    name: invite.name,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
  }))

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

      <InviteTable initialInvites={serializedInvites} />
    </div>
  )
}
