import Link from 'next/link'
import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { Button } from '@/components/design-system/button'
import {
  HomeAnswerableQuestions,
  HomeAnswerableQuestionsFallback,
} from '@/components/posts/home-answerable-questions'
import { Separator } from '@/components/ui/separator'

type QaDetailPageShellProps = {
  children: ReactNode
}

function QaDetailPageShell({ children }: QaDetailPageShellProps) {
  return (
    <article className="flex min-w-0 flex-1 xl:gap-8">
      <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 bg-background px-4 pt-8">
          <div className="flex w-full items-center justify-between pb-8">
            <Button
              variant="secondary"
              size="large"
              render={<Link href="/" />}
              nativeButton={false}
            >
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
        </div>
        <div className="flex flex-col gap-8 px-4 py-8">{children}</div>
      </div>
      <Suspense fallback={<HomeAnswerableQuestionsFallback />}>
        <HomeAnswerableQuestions />
      </Suspense>
    </article>
  )
}

export { QaDetailPageShell }
