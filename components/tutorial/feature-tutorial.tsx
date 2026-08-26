'use client'

import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { MascotContainer } from '@/components/design-system/ui/mascot-container'
import type { HirobaPost } from '@/components/design-system/ui/post-card'
import { Button } from '@/components/ui/button'
import type { QaPost } from '@/lib/questions/qa-post'

const FEATURE_TUTORIAL_COMPLETED_KEY = 'yoriai-feature-tutorial-completed-v1'

const TUTORIAL_QA_POSTS: QaPost[] = [
  {
    id: 'tutorial-qa-ask',
    title: '会議で知らない言葉が出たとき、どう質問すればいいですか？',
    body: '先輩に聞きたいのですが、初歩的な質問かもしれないと思うと少し緊張します。',
    displayName: 'パンさん',
    avatarUrl: null,
    isOwnQuestion: false,
    likeCount: 4,
    liked: false,
    bookmarkCount: 2,
    saved: false,
    status: 'OPEN',
    answerCount: 3,
    tags: [{ id: 'tutorial-tag-communication', name: 'コミュニケーション' }],
    createdAt: '2026-08-25T01:00:00Z',
    activityAt: '2026-08-25T02:00:00Z',
    updatedAt: '2026-08-25T02:00:00Z',
  },
  {
    id: 'tutorial-qa-answer',
    title: '新卒でも回答できそうな質問はありますか？',
    body: '自分の経験が誰かの役に立つなら、回答やいいねで参加してみたいです。',
    displayName: 'わにさん',
    avatarUrl: null,
    isOwnQuestion: false,
    likeCount: 7,
    liked: false,
    bookmarkCount: 1,
    saved: false,
    status: 'RESOLVED',
    answerCount: 5,
    tags: [{ id: 'tutorial-tag-onboarding', name: '新卒・研修' }],
    createdAt: '2026-08-24T01:00:00Z',
    activityAt: '2026-08-25T00:30:00Z',
    updatedAt: '2026-08-25T00:30:00Z',
  },
]

const TUTORIAL_HIROBA_POSTS: HirobaPost[] = [
  {
    id: 'tutorial-hiroba-lunch',
    hirobaSlug: 'feature-testing',
    title: 'おすすめランチを教えてください！よりあイヌも参加したいです',
    body: '気軽におすすめを教えてください。',
    imageUrl: null,
    authorId: 'tutorial-user-lunch',
    displayName: '佐藤 はな',
    displayNameColor: 'GREEN',
    avatarUrl: null,
    lunchPreference: 'TEAM',
    isOwnPost: false,
    likeCount: 8,
    liked: false,
    saved: false,
    answerCount: 4,
    tags: [{ id: 'tutorial-tag-lunch', name: 'ランチ' }],
    createdAt: '2026-08-25T01:30:00Z',
  },
  {
    id: 'tutorial-hiroba-welcome',
    hirobaSlug: 'feature-testing',
    title: 'はじめまして！返信といいねを試してみます',
    body: '練習用の投稿です。',
    imageUrl: null,
    authorId: 'tutorial-user-welcome',
    displayName: '鈴木 そら',
    displayNameColor: 'BLUE',
    avatarUrl: null,
    lunchPreference: 'NO_PREFERENCE',
    isOwnPost: false,
    likeCount: 3,
    liked: false,
    saved: false,
    answerCount: 2,
    tags: [{ id: 'tutorial-tag-welcome', name: 'はじめまして' }],
    createdAt: '2026-08-25T00:30:00Z',
  },
]

const TUTORIAL_STEPS = [
  {
    title: 'よりあイヌと探検をはじめるワン！',
    message: '短い足でも案内はばっちりだワン！',
    body: [
      'よりあイヌと一緒に、なんでもQ&Aとひろばを探検するワン！',
      '案内中だけ練習用の投稿が出るから、実際の画面を見ながら覚えられるワン！',
      '張り切りすぎて転ばないように先導するから、ついてきてほしいワン！',
    ],
    route: '/',
    nextLabel: 'Q&Aを見てみるワン！',
  },
  {
    title: 'なんでもQ&Aをたしかめるワン！',
    message: 'これは極秘質問ミッションだワン…！',
    body: [
      '仕事の疑問は匿名で質問できるから、初歩的かもと思っても安心だワン！',
      '気になる質問は保存、共感したらいいね、答えられそうなら回答できるワン！',
      '検索やカテゴリー、回答状況の絞り込みを使うと、知りたい質問を見つけやすいワン！',
    ],
    route: '/',
    nextLabel: 'ひろばへ行くワン！',
  },
  {
    title: '機能たしかめ広場へようこそだワン！',
    message: 'ランチの投稿を発見したワン！',
    body: [
      'ひろばでは名前を出して、趣味や日々の発見をみんなと共有できるワン！',
      '気になるひろばに参加すると投稿や返信ができて、いいねや保存でも交流できるワン！',
      '機能たしかめ広場はいつでも参加済みだから、まずはここで操作を試せるワン！',
    ],
    route: '/hiroba/feature-testing',
    nextLabel: '最後の確認へ進むワン！',
  },
  {
    title: '探検完了だワン！',
    message: 'みんなと仲良くなる準備は完璧だワン！',
    body: [
      'これで質問する場所と、好きなことを共有する場所がわかったワン！',
      '練習用の投稿は案内を終えると消えるから、本物の投稿にも安心して参加できるワン！',
      '困ったらメニューの使い方ガイドから、いつでもよりあイヌを呼んでほしいワン！',
    ],
    route: '/hiroba/feature-testing',
    nextLabel: '探検を終えるワン！',
  },
] as const

type FeatureTutorialContextValue = {
  active: boolean
  start: () => void
}

const FeatureTutorialContext = createContext<FeatureTutorialContextValue>({
  active: false,
  start: () => undefined,
})

function FeatureTutorialProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const initialized = useRef(false)
  const [step, setStep] = useState<number | null>(null)
  const active = step !== null

  function start() {
    setStep(0)
    if (pathname !== '/') router.push('/')
  }

  function finish() {
    try {
      window.localStorage.setItem(FEATURE_TUTORIAL_COMPLETED_KEY, 'true')
    } catch {
      // 保存できない環境でも、表示中の案内は終了する。
    } finally {
      setStep(null)
    }
  }

  function goToStep(nextStep: number) {
    const tutorialStep = TUTORIAL_STEPS[nextStep]
    setStep(nextStep)
    if (tutorialStep.route !== pathname) router.push(tutorialStep.route)
  }

  function handleNext() {
    if (step === null) return
    if (step === TUTORIAL_STEPS.length - 1) {
      finish()
      return
    }
    goToStep(step + 1)
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    let completed = false
    try {
      completed = window.localStorage.getItem(FEATURE_TUTORIAL_COMPLETED_KEY) === 'true'
    } catch {
      // 保存領域を使えない環境でも、案内そのものは利用できるようにする。
    }
    if (!completed) {
      setStep(0)
      if (pathname !== '/') router.push('/')
    }
  }, [pathname, router])

  const tutorialStep = step === null ? null : TUTORIAL_STEPS[step]
  const stepIndex = step ?? 0

  return (
    <FeatureTutorialContext.Provider value={{ active, start }}>
      {children}
      {tutorialStep && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="feature-tutorial-title"
          aria-describedby="feature-tutorial-description"
          className="fixed inset-x-4 bottom-4 z-50 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-2xl"
        >
          <div className="grid gap-5 p-5 sm:grid-cols-[10rem_1fr] sm:p-6">
            <MascotContainer
              className="hidden self-center sm:flex [&_img]:h-auto [&_img]:w-32"
              variant={stepIndex === TUTORIAL_STEPS.length - 1 ? 'closeEye' : 'uruuru'}
              message={tutorialStep.message}
            />
            <div className="min-w-0" aria-live="polite">
              <p className="text-caption font-bold text-primary">
                {stepIndex + 1} / {TUTORIAL_STEPS.length}
              </p>
              <h2 id="feature-tutorial-title" className="mt-2 text-heading-3">
                {tutorialStep.title}
              </h2>
              <p id="feature-tutorial-description" className="sr-only">
                Yoriaiの主な機能をよりあイヌが案内するチュートリアルだワン！
              </p>
              <div className="mt-4 space-y-2 text-paragraph-small text-secondary-foreground">
                {tutorialStep.body.map((sentence) => (
                  <p key={sentence}>{sentence}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={finish}>
              <X aria-hidden />
              今回はここまでにするワン！
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {stepIndex > 0 && (
                <Button type="button" variant="outline" onClick={() => goToStep(stepIndex - 1)}>
                  <ChevronLeft aria-hidden />
                  ひとつ戻るワン！
                </Button>
              )}
              <Button type="button" onClick={handleNext}>
                {tutorialStep.nextLabel}
                {stepIndex < TUTORIAL_STEPS.length - 1 && <ChevronRight aria-hidden />}
              </Button>
            </div>
          </div>
        </aside>
      )}
    </FeatureTutorialContext.Provider>
  )
}

function FeatureTutorialStartButton({ onStart }: { onStart?: () => void }) {
  const { start } = useFeatureTutorial()

  return (
    <button
      type="button"
      onClick={() => {
        start()
        onStart?.()
      }}
      className="flex items-center gap-2 rounded-full px-6 py-3 text-left text-paragraph-small font-bold text-sidebar-foreground transition-colors hover:bg-muted"
    >
      <BookOpen className="size-4" aria-hidden />
      使い方ガイドを見るワン！
    </button>
  )
}

function useFeatureTutorial() {
  return useContext(FeatureTutorialContext)
}

export {
  FEATURE_TUTORIAL_COMPLETED_KEY,
  FeatureTutorialProvider,
  FeatureTutorialStartButton,
  TUTORIAL_HIROBA_POSTS,
  TUTORIAL_QA_POSTS,
  useFeatureTutorial,
}
