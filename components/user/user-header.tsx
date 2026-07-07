'use client'

import NextLink from 'next/link'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import { LogoutButton } from '@/components/user/logout-button'

export function UserHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header className="border-b">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          component={NextLink}
          href="/"
          underline="none"
          color="text.primary"
          sx={{ fontWeight: 'bold', fontSize: '1.125rem' }}
        >
          社内Q&A
        </Link>
        <nav className="flex items-center gap-4">
          {isAdmin && (
            <Link
              component={NextLink}
              href="/admin"
              underline="hover"
              color="text.secondary"
              variant="body2"
            >
              管理者画面へ
            </Link>
          )}
          <Button component={NextLink} href="/posts/new" variant="contained" size="small">
            質問する
          </Button>
          <LogoutButton />
        </nav>
      </div>
    </header>
  )
}
