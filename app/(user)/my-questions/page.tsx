import Link from 'next/link'
import { Suspense } from 'react'

import { Button } from '@/components/design-system/button'
import { HeaderSection } from '@/components/design-system/ui/header-section'
import { MyQuestionsList } from '@/components/my-questions/my-questions-list'
import { MyQuestionsListFallback } from '@/components/my-questions/my-questions-list-fallback'
import {
  MyQuestionsNavigationProvider,
  MyQuestionsNavigationShell,
} from '@/components/my-questions/my-questions-navigation'
import { MyQuestionsTabs } from '@/components/my-questions/my-questions-tabs'
import { Separator } from '@/components/ui/separator'

type Props = {
  searchParams: Promise<{ tab?: string; page?: string }>
}

function positivePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export default async function MyQuestionsPage({ searchParams }: Props) {
  const params = await searchParams
  const tab = params.tab === 'saved' ? 'saved' : 'posted'
  const page = positivePage(params.page)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <HeaderSection
        className="h-14"
        actions={
          <Button variant="secondary" size="large" render={<Link href="/" />} nativeButton={false}>
            一覧に戻る
          </Button>
        }
      />
      <MyQuestionsNavigationProvider>
        <MyQuestionsNavigationShell className="mt-8">
          <MyQuestionsTabs tab={tab} />
          <Separator />
          <Suspense fallback={<MyQuestionsListFallback />} key={`${tab}-${page}`}>
            <MyQuestionsList tab={tab} page={page} />
          </Suspense>
        </MyQuestionsNavigationShell>
      </MyQuestionsNavigationProvider>
    </main>
  )
}
