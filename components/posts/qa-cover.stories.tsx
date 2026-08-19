import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { QaCover } from './qa-cover'

const meta = {
  component: QaCover,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof QaCover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    // カバー画像は装飾目的（alt=""）なので presentation ロールで取得する
    await expect(canvas.getByRole('presentation')).toBeVisible()
  },
}
