import { Suspense } from 'react'

import { HeaderSection } from '@/components/design-system/ui/header-section'
import { AnswerableQuestionsFallback } from '@/components/posts/answerable-questions-fallback'
import { HomeAnswerableQuestions } from '@/components/posts/home-answerable-questions'
import { HomeQaQuestionList } from '@/components/posts/home-qa-question-list'
import { HomeQaTags } from '@/components/posts/home-qa-tags'
import { QaCover } from '@/components/posts/qa-cover'
import { QaFeedFiltersFallback } from '@/components/posts/qa-feed-filters-fallback'
import { QaFeedListFallback } from '@/components/posts/qa-feed-list-fallback'
import { QuestionComposeDialog } from '@/components/posts/question-compose-dialog'

export default function QaHomePage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <QaCover />
      <div className="flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <HeaderSection
            className="sticky top-0 z-30 h-25 p-8"
            title="なんでもQ&A"
            actions={<QuestionComposeDialog />}
          />
          <div className="relative flex flex-1 flex-col">
            <Suspense fallback={<QaFeedFiltersFallback />}>
              <HomeQaTags />
            </Suspense>
            <Suspense fallback={<QaFeedListFallback />}>
              <HomeQaQuestionList />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={<AnswerableQuestionsFallback />}>
          <HomeAnswerableQuestions />
        </Suspense>
      </div>
    </div>
  )
}
