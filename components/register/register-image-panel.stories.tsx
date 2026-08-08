import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import completeRightImage from '@/assets/register-complete-right.png'
import confirmRightImage from '@/assets/register-confirm-right.png'
import { RegisterImagePanel } from './register-image-panel'

const meta = {
  component: RegisterImagePanel,
  parameters: {
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof RegisterImagePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('ロゴ')).toBeVisible()
    await expect(canvas.getByText('会社の「初めまして」をもっと身近に')).toBeVisible()
    // 背景画像は装飾目的（alt="")なので presentation ロールで取得する
    await expect(canvas.getByRole('presentation')).toBeVisible()
  },
}

export const ConfirmImage: Story = {
  args: {
    image: confirmRightImage,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('presentation')).toBeVisible()
  },
}

export const CompleteImage: Story = {
  args: {
    image: completeRightImage,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('presentation')).toBeVisible()
  },
}
