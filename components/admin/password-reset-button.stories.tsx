import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, screen } from 'storybook/test'
import { PasswordResetButton } from './password-reset-button'

const meta = {
  component: PasswordResetButton,
} satisfies Meta<typeof PasswordResetButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { userId: 'user-2', userName: '一般ユーザー' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'パスワードリセットリンクを発行' }))
    await expect(await screen.findByText(/リセットリンク/)).toBeInTheDocument()
  },
}
