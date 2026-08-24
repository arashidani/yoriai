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

export const MultipleAvatars: Story = {
  args: {
    profiles: [
      {
        ...MOCK_ANONYMOUS_PROFILES[0],
        avatarUrls: [
          '/anonymous-profiles/cat.svg',
          '/anonymous-profiles/dog.svg',
          '/anonymous-profiles/rabbit.svg',
        ],
      },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByAltText('ねこ #1')).toBeVisible()
    await expect(canvas.getByAltText('ねこ #3')).toBeVisible()
  },
}
