import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, screen } from 'storybook/test'
import { CreateInviteDialog } from './create-invite-dialog'

const meta = {
  component: CreateInviteDialog,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof CreateInviteDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '招待リンクを作成' }))
    const nameInput = await screen.findByLabelText('名前（仮）')
    await userEvent.type(nameInput, '山田 太郎')
    await userEvent.click(screen.getByRole('button', { name: '発行する' }))
    await expect(await screen.findByText(/招待リンク/)).toBeInTheDocument()
  },
}

export const RequiresName: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '招待リンクを作成' }))
    await userEvent.click(await screen.findByRole('button', { name: '発行する' }))
    await expect(await screen.findByText('名前（仮）を入力してください')).toBeInTheDocument()
  },
}
