import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, screen, waitFor } from 'storybook/test'
import { ConfirmDeleteButton } from './confirm-delete-button'

const meta = {
  component: ConfirmDeleteButton,
  args: {
    triggerLabel: 'サンプル項目を削除',
    title: 'サンプル項目を削除しますか？',
    description: '「サンプル項目」を削除します。関連するデータもまとめて削除されます。',
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmDeleteButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'サンプル項目を削除' }))
    await waitFor(() => expect(screen.getByText('サンプル項目を削除しますか？')).toBeVisible())
    await waitFor(() =>
      expect(
        screen.getByText('「サンプル項目」を削除します。関連するデータもまとめて削除されます。'),
      ).toBeVisible(),
    )
    await expect(args.onConfirm).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: '削除する' }))
    await waitFor(() => expect(args.onConfirm).toHaveBeenCalledOnce())
  },
}

export const Cancelled: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'サンプル項目を削除' }))
    await userEvent.click(await screen.findByRole('button', { name: 'キャンセル' }))

    await waitFor(() =>
      expect(screen.queryByText('サンプル項目を削除しますか？')).not.toBeInTheDocument(),
    )
    await expect(args.onConfirm).not.toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'サンプル項目を削除' })).toBeDisabled()
  },
}
