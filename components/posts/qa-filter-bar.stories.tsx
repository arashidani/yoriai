import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { QaFilterBar } from './qa-filter-bar'

const meta = {
  component: QaFilterBar,
} satisfies Meta<typeof QaFilterBar>

export default meta
type Story = StoryObj<typeof meta>

const baseTags = [
  { id: 'tag-1', name: 'Next.js' },
  { id: 'tag-2', name: 'TypeScript' },
]

export const Default: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    tags: baseTags,
    selectedTagIds: [],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('キーワードを入力')).toBeVisible()
    await expect(canvas.getByText('カテゴリーを選択')).toBeVisible()
  },
}

export const Mobile: Story = {
  args: Default.args,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: Default.play,
}

export const Web: Story = {
  args: Default.args,
  decorators: [
    (Story) => (
      <div className="w-3xl">
        <Story />
      </div>
    ),
  ],
  play: Default.play,
}

export const WideWeb: Story = {
  args: Default.args,
  decorators: [
    (Story) => (
      <div className="w-5xl">
        <Story />
      </div>
    ),
  ],
  play: Default.play,
}

export const WithKeywordAndTag: Story = {
  args: {
    keyword: 'TypeScript',
    onKeywordChange: fn(),
    tags: baseTags,
    selectedTagIds: ['tag-2'],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('TypeScript')).toBeVisible()
    await expect(canvas.getByText('TypeScript')).toBeVisible()
  },
}

export const NoneSelected: Story = {
  args: Default.args,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await expect(await screen.findByRole('option', { name: 'なし' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

export const ExclusiveTag: Story = {
  args: Default.args,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Next.js' }))
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'TypeScript' }))
    await expect(args.onSelectedTagIdsChange).toHaveBeenLastCalledWith(['tag-2'])
  },
}

export const ChangeTag: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    tags: baseTags,
    selectedTagIds: ['tag-2'],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Next.js' }))
    await expect(args.onSelectedTagIdsChange).toHaveBeenLastCalledWith(['tag-1'])
  },
}

export const ClearTag: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    tags: baseTags,
    selectedTagIds: ['tag-2'],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'なし' }))
    await expect(args.onSelectedTagIdsChange).toHaveBeenLastCalledWith([])
  },
}

export const KeywordInput: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    tags: baseTags,
    selectedTagIds: [],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByPlaceholderText('キーワードを入力'), 'Next')
    await expect(args.onKeywordChange).toHaveBeenCalled()
  },
}
