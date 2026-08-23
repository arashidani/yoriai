'use client'

import { useRouter } from 'next/navigation'
import { createContext, type ReactNode, useContext, useTransition } from 'react'

import { MyQuestionsListFallback } from '@/components/my-questions/my-questions-list-fallback'
import { cn } from '@/lib/utils'

type MyQuestionsNavigationContextValue = {
  navigate: (url: string) => void
  isPending: boolean
}

const MyQuestionsNavigationContext = createContext<MyQuestionsNavigationContextValue | null>(null)

type MyQuestionsNavigationProviderProps = {
  children: ReactNode
  /** Storybook 等で `router.push` の代わりに使う */
  onNavigate?: (url: string) => void
}

function MyQuestionsNavigationProvider({
  children,
  onNavigate,
}: MyQuestionsNavigationProviderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function navigate(url: string) {
    startTransition(() => {
      if (onNavigate) {
        onNavigate(url)
        return
      }
      router.push(url)
    })
  }

  return (
    <MyQuestionsNavigationContext value={{ navigate, isPending }}>
      {children}
    </MyQuestionsNavigationContext>
  )
}

function useMyQuestionsNavigation() {
  const context = useContext(MyQuestionsNavigationContext)
  if (!context) {
    throw new Error('useMyQuestionsNavigation must be used within MyQuestionsNavigationProvider')
  }
  return context
}

type MyQuestionsNavigationShellProps = {
  className?: string
  children: ReactNode
}

function MyQuestionsNavigationShell({ className, children }: MyQuestionsNavigationShellProps) {
  return <div className={cn('flex flex-col items-start', className)}>{children}</div>
}

type MyQuestionsPendingListProps = {
  children: ReactNode
}

function MyQuestionsPendingList({ children }: MyQuestionsPendingListProps) {
  const { isPending } = useMyQuestionsNavigation()

  return (
    <div className="w-full min-h-48" aria-busy={isPending}>
      {isPending && <MyQuestionsListFallback />}
      <div className={isPending ? 'hidden' : 'contents'}>{children}</div>
    </div>
  )
}

export {
  MyQuestionsNavigationProvider,
  MyQuestionsNavigationShell,
  MyQuestionsPendingList,
  useMyQuestionsNavigation,
}
