import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { RegisterSidePanel } from './register-side-panel'

const meta = {
  component: RegisterSidePanel,
} satisfies Meta<typeof RegisterSidePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div className="w-full max-w-95 flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-bold text-foreground">ようこそ</h1>
        <p className="text-secondary-foreground">情報を入力してアカウント登録をしましょう</p>
      </div>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ようこそ')).toBeVisible()
  },
}

export const WithCustomClassName: Story = {
  args: {
    className: 'gap-16',
    children: (
      <>
        <p className="text-foreground">1つ目のコンテンツ</p>
        <p className="text-foreground">2つ目のコンテンツ</p>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1つ目のコンテンツ')).toBeVisible()
    await expect(canvas.getByText('2つ目のコンテンツ')).toBeVisible()
  },
}
