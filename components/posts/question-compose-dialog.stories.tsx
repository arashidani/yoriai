import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { expect, screen, userEvent } from 'storybook/test'
import { QuestionComposeDialog } from './question-compose-dialog'

const meta = {
  component: QuestionComposeDialog,
  parameters: {
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof QuestionComposeDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    displayName: '名無しのおせワニ',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '質問する' })).toBeVisible()
  },
}

export const OpenForm: Story = {
  args: {
    displayName: '名無しのおせワニ',
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '質問する' }))
    await expect(await screen.findByText('名無しのおせワニ')).toBeVisible()
    await expect(screen.getByLabelText('質問のタイトル')).toBeVisible()
  },
}

export const SubmitSuccess: Story = {
  args: {
    displayName: '名無しのおせワニ',
  },
  parameters: {
    msw: {
      handlers: [
        http.post('/api/questions', async ({ request }) => {
          const body = (await request.json()) as { title: string; body: string }
          return HttpResponse.json(
            {
              question: { id: 'post-new', title: body.title, body: body.body },
              moderation: { isHidden: false },
            },
            { status: 201 },
          )
        }),
      ],
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '質問する' }))
    await userEvent.type(await screen.findByLabelText('質問のタイトル'), '有給申請の方法について')
    await userEvent.type(screen.getByLabelText('質問の本文'), '申請画面の場所が分かりません。')
    await userEvent.click(screen.getByRole('button', { name: /投稿する/ }))
    await expect(await screen.findByText('質問の投稿が完了しました')).toBeVisible()
  },
}
