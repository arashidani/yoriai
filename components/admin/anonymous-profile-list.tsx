'use client'

import { ImagePlus, MoveDown, MoveUp } from 'lucide-react'
import Image from 'next/image'
import { type ChangeEvent, useRef, useState } from 'react'
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
import { prepareAvatarFileForUpload } from '@/lib/image/process-avatar-client'

type AnonymousProfile = {
  id: string
  displayName: string
  avatarUrls: string[]
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
    setProfiles((prev) => [...prev, { ...profile, avatarUrls: profile.avatarUrls ?? [] }])
  }

  function handleDeleted(profileId: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId))
  }

  function handleUpdated(profile: AnonymousProfile) {
    setProfiles((prev) => prev.map((item) => (item.id === profile.id ? profile : item)))
  }

  async function updateProfile(
    profileId: string,
    data: { isActive?: boolean; avatarUrls?: string[] },
  ) {
    const res = await client.api.admin['anonymous-profiles'][':id'].$patch({
      param: { id: profileId },
      json: data,
    })
    if (!res.ok) throw new Error('更新に失敗しました')
    const { profile } = await res.json()
    handleUpdated({
      ...profile,
      isActive: profile.isActive ?? true,
      avatarUrls: profile.avatarUrls ?? [],
      createdAt: profile.createdAt ?? new Date(),
    })
  }

  async function handleToggleActive(profileId: string, nextActive: boolean) {
    setPendingId(profileId)
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, isActive: nextActive } : p)),
    )

    try {
      await updateProfile(profileId, { isActive: nextActive })
    } catch {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, isActive: !nextActive } : p)),
      )
      toast.error('更新に失敗しました')
      setPendingId(null)
      return
    }
    setPendingId(null)
    toast.success(nextActive ? '割り当て候補に戻しました' : '割り当て候補から外しました')
  }

  async function handleAvatarUpload(profile: AnonymousProfile, file: File | undefined) {
    if (!file) return
    setPendingId(profile.id)
    try {
      const prepared = await prepareAvatarFileForUpload(file)
      const res = await client.api.admin['anonymous-profiles'][':id'].avatars.$post({
        param: { id: profile.id },
        form: { file: prepared },
      })
      if (!res.ok) throw new Error('アップロードに失敗しました')
      const { profile: updated } = await res.json()
      handleUpdated({
        ...updated,
        isActive: updated.isActive ?? true,
        avatarUrls: updated.avatarUrls ?? [],
        createdAt: updated.createdAt ?? new Date(),
      })
      toast.success('アバターを追加しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'アップロードに失敗しました')
    } finally {
      setPendingId(null)
    }
  }

  async function moveAvatar(profile: AnonymousProfile, index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= profile.avatarUrls.length) return
    const avatarUrls = [...profile.avatarUrls]
    ;[avatarUrls[index], avatarUrls[target]] = [avatarUrls[target], avatarUrls[index]]
    setPendingId(profile.id)
    try {
      await updateProfile(profile.id, { avatarUrls })
    } catch {
      toast.error('並び順の更新に失敗しました')
    } finally {
      setPendingId(null)
    }
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
                <TableHead>アバター（#順）</TableHead>
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
                  <TableCell>
                    <AvatarSet
                      profile={profile}
                      disabled={pendingId === profile.id}
                      onUpload={handleAvatarUpload}
                      onMove={moveAvatar}
                    />
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

function AvatarSet({
  profile,
  disabled,
  onUpload,
  onMove,
}: {
  profile: AnonymousProfile
  disabled: boolean
  onUpload: (profile: AnonymousProfile, file: File | undefined) => void
  onMove: (profile: AnonymousProfile, index: number, direction: -1 | 1) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onUpload(profile, event.target.files?.[0])
    event.target.value = ''
  }

  return (
    <div className="flex min-w-52 items-center gap-2">
      {profile.avatarUrls.map((avatarUrl, index) => (
        <div key={avatarUrl} className="relative size-12 shrink-0">
          <Image
            src={avatarUrl}
            alt={`${profile.displayName} #${index + 1}`}
            fill
            unoptimized
            className="rounded-md object-cover"
          />
          <div className="absolute -right-1 -bottom-1 flex rounded-sm bg-background shadow-2xs">
            <button
              type="button"
              aria-label={`${index + 1}番目を前へ`}
              disabled={disabled || index === 0}
              onClick={() => onMove(profile, index, -1)}
            >
              <MoveUp className="size-3" />
            </button>
            <button
              type="button"
              aria-label={`${index + 1}番目を後へ`}
              disabled={disabled || index === profile.avatarUrls.length - 1}
              onClick={() => onMove(profile, index, 1)}
            >
              <MoveDown className="size-3" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="grid size-12 shrink-0 place-items-center rounded-md border border-dashed border-input"
        aria-label={`${profile.displayName}のアバターを追加`}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="size-4" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
