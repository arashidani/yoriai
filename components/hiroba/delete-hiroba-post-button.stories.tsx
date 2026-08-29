import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HttpResponse, http } from 'msw'
import { expect, fn, screen } from 'storybook/test'
import { DeleteHirobaPostButton } from './delete-hiroba-post-button'

const meta = {
  component: DeleteHirobaPostButton,
} satisfies Meta<typeof DeleteHirobaPostButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    postId: 'hiroba-post-1',
    postTitle: '近くに新しくできたお店に行ってみました。',
    onDeleted: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '投稿を削除' }))
    await userEvent.click(await screen.findByRole('button', { name: '削除する' }))
    await expect(await screen.findByText('投稿を削除しました')).toBeInTheDocument()
    await expect(args.onDeleted).toHaveBeenCalledWith('hiroba-post-1')
  },
}

export const DeleteFails: Story = {
  args: {
    postId: 'hiroba-post-1',
    postTitle: '近くに新しくできたお店に行ってみました。',
    onDeleted: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.delete('/api/hiroba-posts/:id', () =>
          HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
        ),
      ],
    },
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '投稿を削除' }))
    await userEvent.click(await screen.findByRole('button', { name: '削除する' }))
    await expect(await screen.findByText('Forbidden')).toBeInTheDocument()
    await expect(args.onDeleted).not.toHaveBeenCalled()
  },
}
