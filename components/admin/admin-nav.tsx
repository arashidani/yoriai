'use client'

import { LogOut, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { IconClose } from '@/components/design-system/icons/icon-close'
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
] as const

const mobileNavItemClassName =
  'flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors'

function useAdminLogout() {
  const router = useRouter()

  return async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
}

function tabClassName(pathname: string, href: string, variant: 'mobile' | 'desktop') {
  const isActive = pathname === href

  if (variant === 'mobile') {
    return cn(
      mobileNavItemClassName,
      isActive
        ? 'bg-muted text-foreground'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    )
  }

  return cn(
    'shrink-0 whitespace-nowrap border-b-2 -mb-px px-4 py-2 text-sm transition-colors',
    isActive
      ? 'border-primary font-medium text-primary'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )
}

function AdminMobileNav() {
  const pathname = usePathname()
  const handleLogout = useAdminLogout()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
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
            className="w-80 gap-0 bg-background p-0 sm:max-w-80"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>管理メニュー</SheetTitle>
              <SheetDescription>管理パネルの各ページへ移動します</SheetDescription>
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
            <div className="flex min-h-0 flex-1 flex-col">
              <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-4">
                {tabs.map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setOpen(false)}
                    className={tabClassName(pathname, tab.href, 'mobile')}
                  >
                    {tab.label}
                  </Link>
                ))}
              </nav>
              <div className="flex shrink-0 flex-col gap-2 border-t px-4 py-4">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className={cn(mobileNavItemClassName, 'text-muted-foreground hover:bg-muted/60')}
                >
                  ユーザー画面へ
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    void handleLogout()
                  }}
                  className={cn(
                    mobileNavItemClassName,
                    'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <LogOut className="mr-2 size-4" />
                  ログアウト
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="truncate text-lg font-bold">管理パネル</h1>
      </div>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="ログアウト"
      >
        <LogOut className="size-4" />
      </button>
    </header>
  )
}

function AdminDesktopNav() {
  const pathname = usePathname()
  const handleLogout = useAdminLogout()

  return (
    <>
      <header className="hidden border-b px-8 py-4 lg:block">
        <h1 className="text-xl font-bold">管理パネル</h1>
      </header>
      <nav className="hidden items-center justify-between border-b px-8 lg:flex">
        <div className="flex min-w-0 flex-1 flex-wrap gap-x-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={tabClassName(pathname, tab.href, 'desktop')}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ユーザー画面へ
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </div>
      </nav>
    </>
  )
}

export function AdminNav() {
  return (
    <>
      <AdminMobileNav />
      <AdminDesktopNav />
    </>
  )
}
