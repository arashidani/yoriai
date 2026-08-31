import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { MarkdownBody } from './markdown-body'

const meta = {
  component: MarkdownBody,
  args: { text: 'こんにちは' },
} satisfies Meta<typeof MarkdownBody>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('こんにちは')).toBeVisible()
  },
}

export const BoldAndList: Story = {
  args: {
    text: '**重要**です。\n\n- りんご\n- みかん',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('重要')).toHaveStyle({ fontWeight: '700' })
    await expect(canvas.getByText('りんご')).toBeVisible()
    await expect(canvas.getByText('みかん')).toBeVisible()
  },
}

export const ListFollowedByParagraph: Story = {
  args: {
    text: '- りんご\n普通のテキスト',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('りんご')).toBeVisible()
    await expect(canvas.getByText('普通のテキスト')).toBeVisible()
    await expect(canvas.getByText('普通のテキスト').closest('li')).toBeNull()
    await expect(canvas.getByText('普通のテキスト').closest('blockquote')).toBeNull()
  },
}

export const WithMention: Story = {
  args: { text: '@ねこ さん、確認お願いします。' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('@ねこ')).toHaveClass('text-primary')
  },
}

export const WithUrl: Story = {
  args: {
    text: '社内ポータルは https://example.com を見てください。',
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'https://example.com' })
    await expect(link).toHaveAttribute('href', 'https://example.com/')
    await expect(link).toHaveAttribute('target', '_blank')
  },
}

export const ExistingLineBreaks: Story = {
  args: {
    text: 'お疲れ様です！！！\n質問したいのですが',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/お疲れ様です/)).toBeVisible()
    await expect(canvas.getByText(/質問したいのですが/)).toBeVisible()
  },
}

export const DisallowedHeadingUnwrapped: Story = {
  args: { text: '# 見出しは本文としては出さない' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('heading')).toBeNull()
    await expect(canvas.getByText('見出しは本文としては出さない')).toBeVisible()
  },
}
