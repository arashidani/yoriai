import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { ProfileFormFallback } from './profile-form-fallback'

const meta = {
  component: ProfileFormFallback,
  decorators: [
    (Story) => (
      <div className="flex min-h-80 flex-1 flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProfileFormFallback>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}
