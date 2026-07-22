import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MOCK_ANONYMOUS_PROFILES } from '@/lib/mocks/fixtures'
import { AnonymousProfileList } from './anonymous-profile-list'

const meta = {
  component: AnonymousProfileList,
} satisfies Meta<typeof AnonymousProfileList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { profiles: MOCK_ANONYMOUS_PROFILES },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('ねこ')).toBeVisible()
    await expect(canvas.getByText('いぬ')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { profiles: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ匿名キャラがありません')).toBeVisible()
  },
}
