import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HttpResponse, http } from 'msw'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { MOCK_ANSWERS } from '@/lib/mocks/fixtures'
import { QaAnswerItemList } from './qa-answer-item-list'

const answers = MOCK_ANSWERS.map((answer, index) => ({
  id: answer.id,
  body: answer.body,
  likeCount: index === 0 ? 0 : answer.likeCount,
  liked: false,
  isOwnAnswer: false,
  isMostLiked: false,
  displayAuthor: {
    displayName: answer.anonymousProfile.displayName,
    avatarUrl: answer.anonymousProfile.avatarUrl,
  },
  createdAt: answer.createdAt,
}))

const meta = {
  component: QaAnswerItemList,
  parameters: {
    nextjs: { appDirectory: true },
  },
  args: { answers },
} satisfies Meta<typeof QaAnswerItemList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ねこ')).toBeVisible()
    await expect(canvas.getByText('いぬ')).toBeVisible()
  },
}

export const Liked: Story = {
  args: {
    answers: [answers[0]],
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '0' }))
    await expect(await canvas.findByRole('button', { name: '1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

export const Empty: Story = {
  args: { answers: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText('ねこ')).not.toBeInTheDocument()
  },
}

export const MostLiked: Story = {
  args: {
    answers: [{ ...answers[0], likeCount: 14, isMostLiked: true }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('ベストアンサー')).toBeVisible()
  },
}

export const OwnAnswer: Story = {
  args: {
    answers: [{ ...answers[0], isOwnAnswer: true }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: '0' })).not.toBeInTheDocument()
  },
}

export const ServerError: Story = {
  args: {
    answers: [answers[0]],
  },
  parameters: {
    msw: {
      handlers: [
        http.post('/api/answers/:id/likes', () =>
          HttpResponse.json({ error: 'Internal Error' }, { status: 500 }),
        ),
      ],
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '0' }))
    await expect(await screen.findByText('いいねの処理に失敗しました')).toBeInTheDocument()
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '0' })).toHaveAttribute('aria-pressed', 'false'),
    )
  },
}
