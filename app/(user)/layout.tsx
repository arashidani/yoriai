import { redirect } from 'next/navigation'
import { Role } from '@/app/generated/prisma/enums'
import { isChatEnabled } from '@/lib/chat/availability'
import { AiChatWidget } from '@/components/layout/ai-chat-widget'
import { Sidebar } from '@/components/layout/sidebar'
import { getCurrentUser } from '@/lib/auth/current-user'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (user && !user.onboardingCompletedAt) redirect('/onboarding')

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar isAdmin={user?.role === Role.ADMIN} />
      <main className="flex min-w-0 flex-1 flex-col bg-background">{children}</main>
      {isChatEnabled() && <AiChatWidget />}
    </div>
  )
}
