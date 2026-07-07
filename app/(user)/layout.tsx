import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { UserHeader } from '@/components/user/user-header'
import { Role } from '@/app/generated/prisma/enums'
import { getCurrentUser } from '@/lib/auth/current-user'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <div className="min-h-screen flex flex-col">
        <UserHeader isAdmin={user?.role === Role.ADMIN} />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">{children}</main>
      </div>
    </AppRouterCacheProvider>
  )
}
