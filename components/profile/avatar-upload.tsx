'use client'

import { OnboardingAvatarUpload } from '@/components/onboarding/onboarding-avatar-upload'

export function AvatarUpload({
  avatarUrl,
  onAvatarUrlChange,
}: {
  avatarUrl: string | null
  onAvatarUrlChange: (avatarUrl: string | null) => void
}) {
  return <OnboardingAvatarUpload avatarUrl={avatarUrl} onAvatarUrlChange={onAvatarUrlChange} />
}
