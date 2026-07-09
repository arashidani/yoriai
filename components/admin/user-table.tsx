'use client'

import { useState } from 'react'
import { Role } from '@/app/generated/prisma/enums'
import { DeleteUserButton } from '@/components/admin/delete-user-button'
import { EditUserDialog } from '@/components/admin/edit-user-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  function handleUpdated(userId: string, updated: { name: string | null; role: Role }) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)))
  }

  function handleDeleted(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ユーザー一覧</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名前</TableHead>
              <TableHead>メール</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
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
