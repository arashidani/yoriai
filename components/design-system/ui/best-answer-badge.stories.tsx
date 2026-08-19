import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { BestAnswerBadge } from './best-answer-badge'

const meta = {
  component: BestAnswerBadge,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof BestAnswerBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('ベストアンサー')).toBeVisible()
  },
}
