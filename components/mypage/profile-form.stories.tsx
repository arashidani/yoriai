import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, userEvent } from 'storybook/test'
import { ProfileForm } from './profile-form'

const meta = {
  component: ProfileForm,
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      )
    },
  ],
} satisfies Meta<typeof ProfileForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    // 表示モード
    await expect(await canvas.findByText('みどりさん')).toBeVisible()
    await expect(canvas.getByText('開発部')).toBeVisible()
    await expect(canvas.getByText('社内ルール・手続き')).toBeVisible()

    // 編集モードへ切り替えてニックネームを変更する
    await userEvent.click(canvas.getByRole('button', { name: '編集' }))
    const username = await canvas.findByLabelText('ニックネーム')
    await expect(username).toHaveValue('みどりさん')
    await userEvent.clear(username)
    await userEvent.type(username, 'あかさん')

    // 保存すると表示モードへ戻る
    await userEvent.click(canvas.getByRole('button', { name: '保存' }))
    await expect(await canvas.findByRole('button', { name: '編集' })).toBeVisible()
  },
}
