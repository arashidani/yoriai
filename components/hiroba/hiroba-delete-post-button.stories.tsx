import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HttpResponse, http } from 'msw'
import { expect, fn, screen } from 'storybook/test'
import { HirobaDeletePostButton } from './hiroba-delete-post-button'

const meta = {
  component: HirobaDeletePostButton,
} satisfies Meta<typeof HirobaDeletePostButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    postId: 'hiroba-post-1',
    postTitle: '今日のランチどこ行きました？',
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
    postTitle: '今日のランチどこ行きました？',
    onDeleted: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.delete('/api/hiroba-posts/:id', () =>
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
