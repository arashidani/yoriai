'use client'

import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Role } from '@/app/generated/prisma/enums'
import { DeleteUserButton } from '@/components/admin/delete-user-button'
import { EditUserDialog } from '@/components/admin/edit-user-dialog'
import { PasswordResetButton } from '@/components/admin/password-reset-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type User = {
  id: string
  email: string
  name: string | null
  role: Role
  createdAt: Date | string
}

type UserTableProps = {
  users: User[]
  currentUserId: string
}

export function UserTable({ users: initialUsers, currentUserId }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [query, setQuery] = useState('')

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [users, query])

  function handleUpdated(userId: string, updated: { name: string | null; role: Role }) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)))
  }

  function handleDeleted(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ユーザー一覧</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="名前またはメールで検索"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名前</TableHead>
              <TableHead>メール</TableHead>
              <TableHead>ユーザー権限</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const isSelf = user.id === currentUserId
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.name ?? '—'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        user.role === Role.ADMIN
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground',
                      )}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('ja-JP')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditUserDialog
                        userId={user.id}
                        initialName={user.name}
                        initialRole={user.role}
                        isSelf={isSelf}
                        onUpdated={(updated) => handleUpdated(user.id, updated)}
                      />
                      <PasswordResetButton userId={user.id} userName={user.name} />
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.name}
                        isSelf={isSelf}
                        onDeleted={handleDeleted}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
