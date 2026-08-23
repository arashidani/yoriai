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
    hiroba: {
      id: 'hiroba-alcohol',
      slug: 'alcohol',
      name: 'お酒',
      description: '好きなお酒やおすすめのおつまみを紹介し合うひろばです。',
      icon: 'wine',
      tone: 'lime',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('お酒')).toBeVisible()
  },
}
