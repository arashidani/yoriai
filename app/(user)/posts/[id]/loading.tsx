import {
  QaDetailAnswerSectionFallback,
  QaDetailAnswersFallback,
  QaDetailQuestionFallback,
} from '@/components/posts/qa-detail-fallback'
import { QaDetailPageShell } from '@/components/posts/qa-detail-page-shell'

export default function QaDetailLoading() {
  return (
    <QaDetailPageShell>
      <QaDetailQuestionFallback />
      <QaDetailAnswerSectionFallback />
      <QaDetailAnswersFallback />
    </QaDetailPageShell>
  )
}
