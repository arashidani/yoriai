import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { getCurrentUser } from '@/lib/auth/current-user'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.onboardingCompletedAt) redirect('/')

  return (
    <main>
      <OnboardingForm initialUsername={user.username ?? ''} />
    </main>
  )
}
