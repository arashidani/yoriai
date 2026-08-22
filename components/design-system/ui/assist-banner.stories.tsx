import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AssistBanner } from './assist-banner'

const meta = {
  component: AssistBanner,
  args: {
    children: '1週間経過後、一番いいねが多い回答にはにくきゅうバッジが付与されます。',
  },
} satisfies Meta<typeof AssistBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { variant: 'ai' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('1週間経過後、一番いいねが多い回答にはにくきゅうバッジが付与されます。'),
    ).toBeVisible()
  },
}

export const Support: Story = {
  args: {
    variant: 'support',
    children: 'この質問は投稿者が解決済みに変更したため回答はできません。',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('この質問は投稿者が解決済みに変更したため回答はできません。'),
    ).toBeVisible()
  },
}
