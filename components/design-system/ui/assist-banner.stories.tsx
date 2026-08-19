import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AssistBanner } from './assist-banner'

const meta = {
  component: AssistBanner,
  args: {
    children: 'AIが自動でカテゴリタグを付与し、回答されやすくします。',
  },
} satisfies Meta<typeof AssistBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('AIが自動でカテゴリタグを付与し、回答されやすくします。'),
    ).toBeVisible()
  },
}
