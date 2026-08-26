'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/design-system/button'

export function BackButton() {
  const router = useRouter()

  return (
    <Button size="large" variant="secondary" onClick={() => router.back()}>
      戻る
    </Button>
  )
}
