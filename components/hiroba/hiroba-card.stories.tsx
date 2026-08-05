import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { HirobaCard } from './hiroba-card'

const meta = {
  component: HirobaCard,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof HirobaCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    hiroba: { slug: 'hiroba-1', name: '広場１', description: 'みんなで気軽に話せる広場です。' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('広場１')).toBeVisible()
  },
}
