import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MascotAnswerContainer } from './mascot-answer-container'

const meta = {
  component: MascotAnswerContainer,
} satisfies Meta<typeof MascotAnswerContainer>

export default meta
type Story = StoryObj<typeof meta>

export const Shikushiku: Story = {
  args: { variant: 'shikushiku', message: 'ボクもこれ\n気になるワンッ...' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/気になるワンッ/)).toBeVisible()
  },
}

export const Xx: Story = {
  args: { variant: 'xx', message: '答えが気になっちゃう\nワン！' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/答えが気になっちゃう/)).toBeVisible()
  },
}
