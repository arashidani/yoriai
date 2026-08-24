import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HttpResponse, http } from 'msw'
import { expect, fn, waitFor } from 'storybook/test'
import { QuestionItemActions } from './question-item-actions'

const likeRequest = fn()
const bookmarkRequest = fn()

const meta = {
  component: QuestionItemActions,
  args: {
    postId: 'post-1',
    commentCount: 1,
    likeCount: 3,
    liked: false,
    bookmarkCount: 5,
    bookmarked: false,
  },
} satisfies Meta<typeof QuestionItemActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'false')
  },
}

export const OwnQuestion: Story = {
  args: { isOwnQuestion: true, likeCount: 7 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: '7' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: '5' })).toBeVisible()
  },
}

export const ToggleLike: Story = {
  play: async ({ canvas, userEvent }) => {
    const likeButton = canvas.getByRole('button', { name: '3' })
    await userEvent.click(likeButton)
    const pressedLikeButton = canvas.getByRole('button', { name: '4' })
    await expect(pressedLikeButton).toHaveAttribute('aria-pressed', 'true')
    await expect(pressedLikeButton).toHaveClass(/aria-pressed:text-action-like/)
  },
}

export const ToggleBookmark: Story = {
  play: async ({ canvas, userEvent }) => {
    const bookmarkButton = canvas.getByRole('button', { name: '5' })
    await userEvent.click(bookmarkButton)
    await expect(canvas.getByRole('button', { name: '6' })).toHaveAttribute('aria-pressed', 'true')
  },
}

export const SyncOptimisticInteractions: Story = {
  args: { postId: 'post-sync' },
  parameters: {
    msw: {
      handlers: [
        http.post('/api/questions/:id/likes', () => {
          likeRequest()
          return HttpResponse.json({ liked: true, likeCount: 4 })
        }),
        http.post('/api/questions/:id/bookmarks', () => {
          bookmarkRequest()
          return HttpResponse.json({ saved: true, bookmarkCount: 6 })
        }),
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    likeRequest.mockClear()
    bookmarkRequest.mockClear()

    await userEvent.click(canvas.getByRole('button', { name: '3' }))
    await userEvent.click(canvas.getByRole('button', { name: '5' }))

    await expect(canvas.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: '6' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(likeRequest).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(bookmarkRequest).toHaveBeenCalledTimes(1))
  },
}
