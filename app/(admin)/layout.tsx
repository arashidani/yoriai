'use client'

import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/admin/dashboard', label: 'ダッシュボード' },
  { href: '/admin/users/create', label: 'ユーザー作成' },
  { href: '/admin/users', label: 'ユーザー管理' },
  { href: '/admin/ai-flags', label: 'AIフラグ' },
  { href: '/admin/anonymous-profiles', label: '匿名キャラ管理' },
  { href: '/admin/tags', label: 'タグ管理' },
  { href: '/admin/profile-options', label: 'プロフィール項目管理' },
  { href: '/admin/tag-categories', label: 'タグカテゴリー管理' },
  { href: '/admin/hiroba', label: 'ひろば一覧' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="admin-panel min-h-screen">
      <header className="border-b px-8 py-4">
        <h1 className="text-xl font-bold">管理パネル</h1>
      </header>
      <nav className="flex items-center justify-between border-b px-8">
        <div className="flex min-w-0 flex-1 flex-wrap gap-x-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'shrink-0 whitespace-nowrap px-4 py-2 text-sm border-b-2 -mb-px transition-colors',
                pathname === tab.href
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  )
}
