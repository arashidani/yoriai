import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { HirobaFeed } from '@/components/hiroba/hiroba-feed'
import { QaFeedList } from '@/components/posts/qa-feed-list'
import { useQaFeedFilterStore } from '@/lib/stores/qa-feed-filter-store'
import {
  FEATURE_TUTORIAL_COMPLETED_KEY,
  FeatureTutorialProvider,
  useFeatureTutorial,
} from './feature-tutorial'

function TutorialStatePreview() {
  const { active } = useFeatureTutorial()
  return <p>{active ? '練習投稿を表示中' : '練習投稿は非表示'}</p>
}

function FeatureTutorialStory() {
  return (
    <FeatureTutorialProvider>
      <TutorialStatePreview />
    </FeatureTutorialProvider>
  )
}

const meta = {
  component: FeatureTutorialStory,
  parameters: {
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => {
      window.localStorage.removeItem(FEATURE_TUTORIAL_COMPLETED_KEY)
      useQaFeedFilterStore.getState().resetFilters()
      return <Story />
    },
  ],
} satisfies Meta<typeof FeatureTutorialStory>

export default meta
type Story = StoryObj<typeof meta>

export const Visual: Story = {}

export const CompleteTour: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('練習投稿を表示中')).toBeVisible()
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'よりあイヌと探検をはじめるワン！' }),
      ).toBeVisible(),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Q&Aを見てみるワン！' }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'なんでもQ&Aをたしかめるワン！' })).toBeVisible(),
    )

    await userEvent.click(screen.getByRole('button', { name: 'ひろばへ行くワン！' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: '機能たしかめ広場へようこそだワン！' }),
      ).toBeVisible(),
    )

    await userEvent.click(screen.getByRole('button', { name: '最後の確認へ進むワン！' }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '探検完了だワン！' })).toBeVisible(),
    )

    await userEvent.click(screen.getByRole('button', { name: '探検を終えるワン！' }))
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(canvas.getByText('練習投稿は非表示')).toBeVisible()
    await expect(window.localStorage.getItem(FEATURE_TUTORIAL_COMPLETED_KEY)).toBe('true')
  },
}

export const SkipTour: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('練習投稿を表示中')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: '今回はここまでにするワン！' }))
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(canvas.getByText('練習投稿は非表示')).toBeVisible()
  },
}

export const DummyPostsOnlyDuringTour: Story = {
  render: () => (
    <FeatureTutorialProvider>
      <div>
        <QaFeedList posts={[]} isAdmin={false} initialTotal={0} initialTotalPages={0} />
        <HirobaFeed
          hiroba={{
            id: 'hiroba-feature-testing',
            slug: 'feature-testing',
            name: '機能たしかめ広場',
            description: '新しい機能を気軽に試すひろばです。',
            icon: 'sparkles',
            tone: 'lime',
          }}
          posts={[]}
          popularPosts={[]}
          isAdmin={false}
          initialJoined
        />
      </div>
    </FeatureTutorialProvider>
  ),
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText('会議で知らない言葉が出たとき、どう質問すればいいですか？'),
    ).toBeInTheDocument()
    await expect(
      canvas.getByText('おすすめランチを教えてください！よりあイヌも参加したいです'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '今回はここまでにするワン！' }))
    await expect(
      canvas.queryByText('会議で知らない言葉が出たとき、どう質問すればいいですか？'),
    ).not.toBeInTheDocument()
    await expect(
      canvas.queryByText('おすすめランチを教えてください！よりあイヌも参加したいです'),
    ).not.toBeInTheDocument()
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
    await expect(canvas.getByText('まだ投稿がありません。')).toBeVisible()
  },
}
