'use client'

import { BellDot, Menu, MessageSquare, Settings, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/brand/logo'
import { IconClose } from '@/components/design-system/icons/icon-close'
import { LogoutButton } from '@/components/logout-button'
import { FeatureTutorialStartButton } from '@/components/tutorial/feature-tutorial'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/hiroba', label: 'ひろば', icon: UsersRound },
  { href: '/', label: 'なんでもQ&A', icon: MessageSquare },
  { href: '/mypage', label: 'マイページ', icon: Settings },
]

type SidebarProps = {
  isAdmin?: boolean
}

function isNavActive(pathname: string, href: string) {
  // なんでもQ&A(/)は投稿詳細・作成ページでもアクティブ扱いにする
  if (href === '/') return pathname === '/' || pathname.startsWith('/posts')
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-8">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-full px-6 py-4 text-paragraph font-bold text-sidebar-foreground transition-colors hover:bg-muted',
            isNavActive(pathname, href) && 'bg-muted',
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
      <FeatureTutorialStartButton onStart={onNavigate} />
    </nav>
  )
}

function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label="メニュー">
            <Menu />
          </Button>
        }
      />
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-80 gap-0 bg-background-subtle p-0 sm:max-w-80"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>メニュー</SheetTitle>
          <SheetDescription>サイト内のページへ移動します</SheetDescription>
        </SheetHeader>
        <div className="flex items-center justify-end px-4 pt-4">
          <SheetClose
            render={
              <button
                type="button"
                aria-label="閉じる"
                className="flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted"
              />
            }
          >
            <IconClose className="text-foreground" />
          </SheetClose>
        </div>
        <div className="flex min-h-0 flex-1 flex-col pb-8">
          <SidebarNav onNavigate={() => setOpen(false)} />
          <div className="flex shrink-0 flex-col items-start gap-2 p-8">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="text-paragraph-small text-secondary-foreground hover:text-foreground"
              >
                管理者画面へ
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** ユーザー画面共通の左ナビゲーション。 */
export function Sidebar({ isAdmin = false }: SidebarProps) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-input bg-background-subtle px-4 py-3 lg:hidden">
        <div className="flex items-center gap-1">
          <MobileNav isAdmin={isAdmin} />
          <Link href="/">
            <Logo variant="full" preload className="h-8 w-auto" />
          </Link>
        </div>
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
        <SidebarNav />
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
