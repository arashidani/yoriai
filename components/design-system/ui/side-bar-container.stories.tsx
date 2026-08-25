import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { SideBarContainer, SideBarContainerFallback } from './side-bar-container'

const items = [
  {
    id: '1',
    avatarSrc: '/anonymous-profiles/bread_scarlet.svg',
    avatarAlt: 'アバター',
    title: 'デリについて',
    excerpt: '17Fにだけハーゲンダッツがあると聞いたのですが本当ですか？',
  },
  {
    id: '2',
    avatarSrc: '/anonymous-profiles/ball_skyblue.svg',
    avatarAlt: 'アバター',
    title: '有給申請の方法',
    excerpt: 'キングオブタイムの申請画面が見つかりません。どこにありますか？',
  },
  {
    id: '3',
    avatarSrc: '/anonymous-profiles/bone_green.svg',
    avatarAlt: 'アバター',
    title: '社内イベントについて',
    excerpt: '来月の懇親会は何時から始まるのでしょうか？',
  },
]

const meta = {
  component: SideBarContainer,
  args: {
    title: 'あなたが回答できる質問',
    message: '極秘任務だワン…！',
    items,
  },
} satisfies Meta<typeof SideBarContainer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'あなたが回答できる質問' })).toBeVisible()
    await expect(canvas.getByText('極秘任務だワン…！')).toBeVisible()
    await expect(canvas.getByText('デリについて')).toBeVisible()
    await expect(canvas.getByText('社内イベントについて')).toBeVisible()
  },
}

export const WithLinks: Story = {
  args: {
    items: items.map((item) => ({ ...item, href: `/posts/${item.id}` })),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('link')).toHaveLength(3)
    await expect(canvas.getByRole('link', { name: /デリについて/ })).toHaveAttribute(
      'href',
      '/posts/1',
    )
  },
}

export const SingleItem: Story = {
  args: { items: [items[0]] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('デリについて')).toBeVisible()
    await expect(canvas.getByText('極秘任務だワン…！')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { items: [], emptyMessage: 'まだ質問がありません。' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('まだ質問がありません。')).toBeVisible()
    await expect(canvas.getByText('極秘任務だワン…！')).toBeVisible()
  },
}

export const Loading: StoryObj<typeof SideBarContainerFallback> = {
  render: () => <SideBarContainerFallback />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: '読み込み中' })).toBeVisible()
  },
}
