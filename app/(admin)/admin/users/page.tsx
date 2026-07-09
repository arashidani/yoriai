import { UserTable } from '@/components/admin/user-table'
import { getCurrentUser } from '@/lib/auth/current-user'
import { MOCK_USERS } from '@/lib/mocks/fixtures'
import { prisma } from '@/lib/prisma/client'

async function getUsers() {
  if (process.env.MOCK_MODE === 'true') return MOCK_USERS
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
}

export default async function AdminUsersPage() {
  const [users, currentUser] = await Promise.all([getUsers(), getCurrentUser()])

  if (!currentUser) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">ユーザー管理</h1>
        <p className="text-muted-foreground">ログインが必要です。</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ユーザー管理</h1>
      <UserTable users={users} currentUserId={currentUser.id} />
    </div>
  )
}
