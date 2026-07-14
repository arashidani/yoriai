import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { AiFlagList } from './ai-flag-list'

const meta = {
  component: AiFlagList,
} satisfies Meta<typeof AiFlagList>

export default meta
type Story = StoryObj<typeof meta>

const flags = [
  {
    id: 'flag-1',
    title: '攻撃的な表現を検出',
    detail: '投稿内に攻撃的とみられる表現が含まれています',
    severity: 'HIGH' as const,
    status: 'UNREAD' as const,
    targetUser: { name: '田中 陽子' },
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'flag-2',
    title: '短時間での連続投稿',
    detail: '5分間に8件の投稿を検出しました',
    severity: 'MEDIUM' as const,
    status: 'CONFIRMED' as const,
    targetUser: { name: '山本 直樹' },
    createdAt: '2024-01-11T00:00:00Z',
  },
]

export const Default: Story = {
  args: { flags },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('未確認 1 件')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '確認済みにする' })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: '確認済み' })).toBeDisabled()
  },
}

export const Empty: Story = {
  args: { flags: [] },
}

export const AllConfirmed: Story = {
  args: { flags: flags.map((f) => ({ ...f, status: 'CONFIRMED' as const })) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/未確認/)).not.toBeInTheDocument()
  },
}
