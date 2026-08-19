'use client'

import { Copy, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Role } from '@/app/generated/prisma/enums'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTimeJst, getJstDateRange } from '@/lib/date-time'
import { client } from '@/lib/hono/client'
import { cn } from '@/lib/utils'

type InviteStatus = 'PENDING' | 'USED' | 'EXPIRED'

type Invite = {
  id: string
  token: string
  name: string | null
  role: Role
  status: InviteStatus
  expiresAt: string
  createdAt: string
}

type InviteTableProps = {
  initialInvites: Invite[]
}

const STATUS_LABELS: Record<InviteStatus, string> = {
  PENDING: '未使用',
  USED: '使用済み',
  EXPIRED: '期限切れ',
}

const STATUS_STYLES: Record<InviteStatus, string> = {
  PENDING: 'bg-primary/10 text-primary',
  USED: 'bg-muted text-muted-foreground',
  EXPIRED: 'bg-destructive/10 text-destructive',
}

export function InviteTable({ initialInvites }: InviteTableProps) {
  const [invites, setInvites] = useState(initialInvites)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Invite | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setInvites(initialInvites)
  }, [initialInvites])

  const filteredInvites = useMemo(() => {
    const startTime = startDate ? getJstDateRange(startDate).start : null
    const endTime = endDate ? getJstDateRange(endDate).end : null

    return invites.filter((invite) => {
      const createdAt = new Date(invite.createdAt).getTime()
      if (startTime !== null && createdAt < startTime) return false
      if (endTime !== null && createdAt > endTime) return false
      return true
    })
  }, [endDate, invites, startDate])

  async function handleCopy(invite: Invite) {
    const inviteLink = `${window.location.origin}/register?token=${invite.token}`
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast.success('招待リンクをコピーしました')
    } catch {
      toast.error('招待リンクのコピーに失敗しました')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    const res = await client.api.admin.invites[':id'].$delete({
      param: { id: deleteTarget.id },
    })
    setDeleting(false)

    if (!res.ok) {
      const body = await res.json()
      const message =
        'error' in body && typeof body.error === 'string' ? body.error : '削除に失敗しました'
      toast.error(message)
      return
    }

    setInvites((current) => current.filter((invite) => invite.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast.success('招待リンクを削除しました')
  }

  function clearFilters() {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="invite-created-from">作成日（開始）</Label>
          <Input
            id="invite-created-from"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-created-to">作成日（終了）</Label>
          <Input
            id="invite-created-to"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        {(startDate || endDate) && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            <X />
            クリア
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50 text-muted-foreground">
            <TableRow>
              <TableHead className="px-5">名前（仮）</TableHead>
              <TableHead>ユーザー権限</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>作成日時</TableHead>
              <TableHead>有効期限</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {invites.length === 0 ? 'まだ招待がありません' : '条件に一致する招待がありません'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="px-5">{invite.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invite.role === Role.ADMIN ? '管理者' : '一般ユーザー'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_STYLES[invite.status],
                      )}
                    >
                      {STATUS_LABELS[invite.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTimeJst(invite.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTimeJst(invite.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`${invite.name ?? '招待'}のリンクをコピー`}
                        onClick={() => handleCopy(invite)}
                      >
                        <Copy />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`${invite.name ?? '招待'}を削除`}
                        onClick={() => setDeleteTarget(invite)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>招待リンクを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name ?? 'この招待'}
              」の招待リンクを削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '削除中...' : '削除する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
