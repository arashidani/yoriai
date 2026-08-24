import Link from 'next/link'
import type { ReactNode } from 'react'

import { Button } from '@/components/design-system/button'
import { Separator } from '@/components/ui/separator'

type QaDetailPageShellProps = {
  children: ReactNode
}

function QaDetailPageShell({ children }: QaDetailPageShellProps) {
  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <div className="flex w-full items-center justify-between">
        <Button variant="secondary" size="large" render={<Link href="/" />} nativeButton={false}>
          一覧に戻る
        </Button>
        <Button
          variant="secondary"
          size="large"
          render={<Link href="/my-questions" />}
          nativeButton={false}
        >
          Q&A管理
        </Button>
      </div>
      <Separator />
      {children}
    </article>
  )
}

export { QaDetailPageShell }
