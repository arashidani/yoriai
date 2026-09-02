import { redirect } from 'next/navigation'
import { Role } from '@/app/generated/prisma/enums'
import { AiChatWidget } from '@/components/layout/ai-chat-widget'
import { Sidebar } from '@/components/layout/sidebar'
import { NotificationPanelColumn } from '@/components/notifications/notification-panel-column'
import { FeatureTutorialProvider } from '@/components/tutorial/feature-tutorial'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isChatEnabled } from '@/lib/chat/availability'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (user && !user.onboardingCompletedAt) redirect('/onboarding')

  return (
    <FeatureTutorialProvider>
      <div className="fixed inset-x-0 top-0 z-50 h-1.5 bg-primary" />
      <div className="flex min-h-screen flex-col pt-1.5 lg:flex-row">
        <Sidebar isAdmin={user?.role === Role.ADMIN} />
        <NotificationPanelColumn />
        <main className="flex min-w-0 flex-1 flex-col bg-background">{children}</main>
        {isChatEnabled() && <AiChatWidget />}
      </div>
    </FeatureTutorialProvider>
  )
}
