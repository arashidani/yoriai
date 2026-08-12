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
    const email = await canvas.findByDisplayValue('dev@example.com')
    await expect(email).toBeDisabled()
    await expect(canvas.getByDisplayValue('開発者')).toBeVisible()
    await expect(canvas.getByDisplayValue('みどりさん')).toBeVisible()
    await expect(canvas.getByRole('checkbox', { name: 'プロジェクト管理' })).toBeChecked()

    await userEvent.clear(canvas.getByLabelText('氏名'))
    await userEvent.type(canvas.getByLabelText('氏名'), '山田 太郎')
    await userEvent.click(canvas.getByRole('button', { name: '変更を保存' }))
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'プロフィールを更新しました。',
    )
  },
}
