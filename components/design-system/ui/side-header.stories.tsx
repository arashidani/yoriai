import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { SideHeader } from './side-header'

const meta = {
  component: SideHeader,
} satisfies Meta<typeof SideHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { title: 'あなたが回答できる質問' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'あなたが回答できる質問' })).toBeVisible()
  },
}

export const LongTitle: Story = {
  args: { title: 'あなたが回答できる質問がこんなにたくさんあります' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading')).toBeVisible()
  },
}
