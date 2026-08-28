import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { YoriainuProfileView } from './yoriainu-profile'

const meta = {
  component: YoriainuProfileView,
} satisfies Meta<typeof YoriainuProfileView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('よりあいぬ')).toBeVisible()
    await expect(canvas.getByText('デザイン＆システム')).toBeVisible()
    await expect(canvas.getByText('全社')).toBeVisible()
    await expect(canvas.getByText('2026年 8月')).toBeVisible()
    await expect(canvas.getByText('みんなを笑顔にすること')).toBeVisible()
    await expect(canvas.getByText('新卒と先輩の架け橋になること')).toBeVisible()
    await expect(canvas.getByText('社内の面白い知識を見つけること')).toBeVisible()
    await expect(canvas.getByText('ランチに美味しいお店を探すこと')).toBeVisible()
    await expect(canvas.getByText('誰かと一緒に食べる')).toBeVisible()
    await expect(canvas.getByText('ラケル')).toBeVisible()
    await expect(canvas.getByText(/ありがとうだワン/)).toBeVisible()
    await expect(canvas.getByText('きいろ')).toBeVisible()
  },
}
