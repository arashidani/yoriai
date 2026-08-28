import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, screen, waitFor } from 'storybook/test'
import { HirobaJoinDialog } from './hiroba-join-dialog'

const meta = {
  component: HirobaJoinDialog,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof HirobaJoinDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    hirobaSlug: 'alcohol',
    hirobaName: 'お酒',
    onJoined: fn(),
  },
  play: async () => {
    // ダイアログはフェードインで開くため、可視になるまで待つ
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())
    await expect(screen.getByRole('button', { name: '参加する' })).toBeVisible()
  },
}
