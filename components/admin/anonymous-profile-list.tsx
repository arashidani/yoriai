'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CreateAnonymousProfileDialog } from '@/components/admin/create-anonymous-profile-dialog'
import { DeleteAnonymousProfileButton } from '@/components/admin/delete-anonymous-profile-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { client } from '@/lib/hono/client'

type AnonymousProfile = {
  id: string
  displayName: string
  avatarUrl: string
  isActive: boolean
  createdAt: Date | string
}

type AnonymousProfileListProps = {
  profiles: AnonymousProfile[]
}

export function AnonymousProfileList({ profiles: initialProfiles }: AnonymousProfileListProps) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [pendingId, setPendingId] = useState<string | null>(null)

  function handleCreated(profile: AnonymousProfile) {
    setProfiles((prev) => [...prev, profile])
  }

  function handleDeleted(profileId: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId))
  }

  async function handleToggleActive(profileId: string, nextActive: boolean) {
    setPendingId(profileId)
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, isActive: nextActive } : p)),
    )

    const res = await client.api.admin['anonymous-profiles'][':id'].$patch({
      param: { id: profileId },
      json: { isActive: nextActive },
    })
    setPendingId(null)

    if (!res.ok) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, isActive: !nextActive } : p)),
      )
      toast.error('更新に失敗しました')
      return
    }
    toast.success(nextActive ? '割り当て候補に戻しました' : '割り当て候補から外しました')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>匿名キャラ一覧</CardTitle>
        <CreateAnonymousProfileDialog onCreated={handleCreated} />
      </CardHeader>
      <CardContent>
        {profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだ匿名キャラがありません</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>表示名</TableHead>
                <TableHead>アイコンURL</TableHead>
                <TableHead>割り当て候補にする</TableHead>
                <TableHead>追加日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold"
                        aria-hidden
                      >
                        {profile.displayName.slice(0, 1)}
                      </div>
                      {profile.displayName}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {profile.avatarUrl}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={profile.isActive}
                      disabled={pendingId === profile.id}
                      onCheckedChange={(checked) => handleToggleActive(profile.id, checked)}
                      aria-label={`${profile.displayName}を割り当て候補にする`}
                    />
                  </TableCell>
                  <TableCell>{new Date(profile.createdAt).toLocaleDateString('ja-JP')}</TableCell>
                  <TableCell>
                    <DeleteAnonymousProfileButton
                      profileId={profile.id}
                      displayName={profile.displayName}
                      onDeleted={handleDeleted}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
