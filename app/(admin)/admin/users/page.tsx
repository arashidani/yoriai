import { UserTable } from '@/components/admin/user-table'
import { getCurrentUser } from '@/lib/auth/current-user'
import { MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getUsers() {
  if (process.env.MOCK_MODE === 'true') return MOCK_USERS
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
}

export default async function UsersPage() {
  const [users, currentUser] = await Promise.all([getUsers(), getCurrentUser()])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ユーザー管理</h2>
        <p className="text-sm text-muted-foreground mt-1">登録済みユーザーの一覧</p>
      </div>

      <UserTable users={users} currentUserId={currentUser?.id ?? ''} />
    </div>
  )
}
