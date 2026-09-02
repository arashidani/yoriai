import type { ReactNode } from 'react'

import { AssistBanner } from '@/components/design-system/ui/assist-banner'

type QaAnswerSectionProps = {
  canAnswer: boolean
  children?: ReactNode
}

function QaAnswerSection({ canAnswer, children }: QaAnswerSectionProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-col gap-4">
        {canAnswer && children}
        <AssistBanner variant={canAnswer ? 'ai' : 'support'}>
          {canAnswer
            ? '1週間経過後、一番いいねが多い回答にはにくきゅうバッジが付与されます。'
            : 'この質問は投稿者が解決済みに変更したため回答はできません。'}
        </AssistBanner>
      </div>
      {canAnswer && (
        <p className="text-caption text-secondary-foreground">※回答にはIBJ歴が表示されます。</p>
      )}
    </div>
  )
}

export type { QaAnswerSectionProps }
export { QaAnswerSection }
