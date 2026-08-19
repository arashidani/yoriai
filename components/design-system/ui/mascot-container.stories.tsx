import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MascotContainer } from './mascot-container'

const meta = {
  component: MascotContainer,
} satisfies Meta<typeof MascotContainer>

export default meta
type Story = StoryObj<typeof meta>

export const Uruuru: Story = {
  args: { variant: 'uruuru', message: 'ボクが質問を届けるワン！' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ボクが質問を届けるワン！')).toBeVisible()
  },
}

export const CloseEye: Story = {
  args: { variant: 'closeEye', message: 'ボクはすぐ忘れちゃうワン' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ボクはすぐ忘れちゃうワン')).toBeVisible()
  },
}
