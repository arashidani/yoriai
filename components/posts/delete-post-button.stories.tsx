import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HttpResponse, http } from 'msw'
import { expect, fn, screen } from 'storybook/test'
import { DeletePostButton } from './delete-post-button'

const meta = {
  component: DeletePostButton,
} satisfies Meta<typeof DeletePostButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    postId: 'post-1',
    postTitle: 'Next.js App Routerの使い方を教えてください',
    onDeleted: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '投稿を削除' }))
    await userEvent.click(await screen.findByRole('button', { name: '削除する' }))
    await expect(await screen.findByText('投稿を削除しました')).toBeInTheDocument()
    await expect(args.onDeleted).toHaveBeenCalledWith('post-1')
  },
}

export const DeleteFails: Story = {
  args: {
    postId: 'post-1',
    postTitle: 'Next.js App Routerの使い方を教えてください',
    onDeleted: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.delete('/api/posts/:id', () =>
          HttpResponse.json({ error: '削除に失敗しました' }, { status: 400 }),
        ),
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '投稿を削除' }))
    await userEvent.click(await screen.findByRole('button', { name: '削除する' }))
    await expect(await screen.findByText('削除に失敗しました')).toBeInTheDocument()
  },
}
