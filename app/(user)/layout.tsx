import Link from 'next/link'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/logout-button'
import { Role } from '@/app/generated/prisma/enums'
import { getCurrentUser } from '@/lib/auth/current-user'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg">
              社内Q&A
            </Link>
            <nav className="flex items-center gap-4">
              {user?.role === Role.ADMIN && (
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                  管理者画面へ
                </Link>
              )}
              <Link href="/posts/new">
                <Button size="sm">質問する</Button>
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">{children}</main>
      </div>
    </AppRouterCacheProvider>
  )
}
