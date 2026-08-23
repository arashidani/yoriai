import { Suspense } from 'react'
import { QaDetailAnswers } from '@/components/posts/qa-detail-answers'
import {
  QaDetailAnswerSectionFallback,
  QaDetailAnswersFallback,
  QaDetailQuestionFallback,
} from '@/components/posts/qa-detail-fallback'
import { QaDetailPageShell } from '@/components/posts/qa-detail-page-shell'
import { QaDetailQuestion } from '@/components/posts/qa-detail-question'

type Props = {
  params: Promise<{ id: string }>
}

export default async function QaDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <QaDetailPageShell>
      <Suspense
        fallback={
          <>
            <QaDetailQuestionFallback />
            <QaDetailAnswerSectionFallback />
          </>
        }
      >
        <QaDetailQuestion id={id} />
      </Suspense>
      <Suspense fallback={<QaDetailAnswersFallback />}>
        <QaDetailAnswers id={id} />
      </Suspense>
    </QaDetailPageShell>
  )
}
