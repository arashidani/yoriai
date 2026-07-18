'use client'

import { BellDot, MessageSquare, Settings, Swords, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/brand/logo'
import { LogoutButton } from '@/components/logout-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/hiroba', label: 'ひろば', icon: UsersRound },
  { href: '/', label: 'おせっかいQA', icon: MessageSquare },
  { href: '/missions', label: 'ミッション', icon: Swords },
  { href: '/mypage', label: 'マイページ', icon: Settings },
]

type SidebarProps = {
  isAdmin?: boolean
}

/** ユーザー画面共通の左ナビゲーション。 */
export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    // おせっかいQA(/)は投稿詳細・作成ページでもアクティブ扱いにする
    if (href === '/') return pathname === '/' || pathname.startsWith('/posts')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-input bg-background-subtle px-4 py-3 lg:hidden">
        <Link href="/">
          <Logo variant="full" preload className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-2 text-paragraph-small text-secondary-foreground hover:bg-muted hover:text-foreground"
            >
              管理者
            </Link>
          )}
          <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label="通知">
            <BellDot />
          </Button>
          <LogoutButton />
        </div>
      </header>
      <aside className="hidden w-80 shrink-0 flex-col bg-background-subtle lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start">
        <div className="flex shrink-0 items-center justify-between p-8">
          <Link href="/">
            <Logo variant="full" preload className="h-9 w-auto" />
          </Link>
          <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label="通知">
            <BellDot />
          </Button>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-8">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                // text-neutral-800: Figma の ghost-foreground。対応する意味トークンがないため
                // ブランド独自 neutral スケールを意図して使用
                'flex items-center gap-2 rounded-full px-6 py-4 text-paragraph font-bold text-neutral-800 transition-colors hover:bg-muted',
                isActive(href) && 'bg-muted',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 flex-col items-start gap-2 p-8">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-paragraph-small text-secondary-foreground hover:text-foreground"
            >
              管理者画面へ
            </Link>
          )}
          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
