'use client'

import { IconBookmark } from '@/components/design-system/icons/icon-bookmark'
import { IconPencil } from '@/components/design-system/icons/icon-pencil'
import { TabBar } from '@/components/design-system/ui/tab-bar'
import { useMyQuestionsNavigation } from '@/components/my-questions/my-questions-navigation'

type MyQuestionsTab = 'posted' | 'saved'

type MyQuestionsTabsProps = {
  tab: MyQuestionsTab
}

function MyQuestionsTabs({ tab }: MyQuestionsTabsProps) {
  const { navigate } = useMyQuestionsNavigation()

  return (
    <TabBar
      value={tab}
      onValueChange={(value) => navigate(`/my-questions?tab=${value}&page=1`)}
      items={[
        {
          value: 'posted',
          label: '投稿した質問',
          icon: <IconPencil className="size-full text-primary" />,
        },
        {
          value: 'saved',
          label: '保存した質問',
          icon: <IconBookmark className="size-full text-amber-400" />,
        },
      ]}
    />
  )
}

export type { MyQuestionsTab }
export { MyQuestionsTabs }
