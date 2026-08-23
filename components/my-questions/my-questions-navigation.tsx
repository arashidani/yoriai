'use client'

import { useRouter } from 'next/navigation'
import { createContext, type ReactNode, useContext, useTransition } from 'react'

import { Spinner } from '@/components/ui/spinner'
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
  const { isPending } = useMyQuestionsNavigation()

  return (
    <div className={cn('relative flex flex-col items-start', className)}>
      {isPending && (
        <div className="absolute inset-0 z-40 bg-background/70">
          <div className="sticky top-1/2 flex -translate-y-1/2 justify-center">
            <Spinner className="size-8 text-primary" aria-label="読み込み中" />
          </div>
        </div>
      )}
      <div className="w-full min-h-48" aria-busy={isPending}>
        {children}
      </div>
    </div>
  )
}

export { MyQuestionsNavigationProvider, MyQuestionsNavigationShell, useMyQuestionsNavigation }
