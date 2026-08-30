'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { JoinButton } from '@/components/design-system/ui/join-button'
import { client } from '@/lib/hono/client'

type HirobaJoinButtonProps = {
  slug: string
  joined: boolean
  canJoin: boolean
}

export function HirobaJoinButton({ slug, joined, canJoin }: HirobaJoinButtonProps) {
  const router = useRouter()
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    if (isUpdatingMembership) return
    setIsUpdatingMembership(true)
    setError(null)

    try {
      const res = await client.api.hiroba[':slug'].membership.$post({ param: { slug } })
      if (!res.ok) {
        setError('参加状態を更新できませんでした。')
        return
      }
      router.refresh()
    } catch {
      setError('通信に失敗しました。もう一度お試しください。')
    } finally {
      setIsUpdatingMembership(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <JoinButton
        type="button"
        joined={joined}
        aria-pressed={joined}
        disabled={joined || !canJoin || isUpdatingMembership}
        onClick={handleJoin}
      />
      {error && (
        <p role="alert" className="text-paragraph-small text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
