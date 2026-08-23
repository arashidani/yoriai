import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { QaFilterBar } from './qa-filter-bar'

const meta = {
  component: QaFilterBar,
} satisfies Meta<typeof QaFilterBar>

export default meta
type Story = StoryObj<typeof meta>

const baseCategories = [
  {
    id: 'category-1',
    name: '技術',
    tags: [
      { id: 'tag-1', name: 'Next.js' },
      { id: 'tag-2', name: 'TypeScript' },
    ],
  },
]

export const Default: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    categories: baseCategories,
    onSelectedCategoryIdsChange: fn(),
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
    categories: baseCategories,
    selectedTagIds: ['tag-2'],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue('TypeScript')).toBeVisible()
    await expect(canvas.getByText('1件選択中')).toBeVisible()
  },
}

export const NoneSelected: Story = {
  args: Default.args,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('カテゴリーを選択')).toBeVisible()
  },
}

export const ExclusiveTag: Story = {
  args: Default.args,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('カテゴリーを選択'))
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Next.js' }))
    await expect(args.onSelectedTagIdsChange).toHaveBeenCalledWith(['tag-1'])
    await expect(args.onSelectedCategoryIdsChange).toHaveBeenCalledWith([])
  },
}

export const SelectParent: Story = {
  args: {
    ...Default.args,
    onSelectedCategoryIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('カテゴリーを選択'))
    await userEvent.click(canvas.getByRole('checkbox', { name: '技術' }))
    await expect(args.onSelectedCategoryIdsChange).toHaveBeenCalledWith(['category-1'])
    await expect(args.onSelectedTagIdsChange).toHaveBeenCalledWith(['tag-1', 'tag-2'])
  },
}

export const SelectLastChild: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    categories: baseCategories,
    selectedCategoryIds: [],
    onSelectedCategoryIdsChange: fn(),
    selectedTagIds: ['tag-1'],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('1件選択中'))
    await userEvent.click(canvas.getByRole('checkbox', { name: 'TypeScript' }))
    await expect(args.onSelectedTagIdsChange).toHaveBeenCalledWith(['tag-1', 'tag-2'])
    await expect(args.onSelectedCategoryIdsChange).toHaveBeenCalledWith(['category-1'])
  },
}

export const FlatOtherCategory: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    categories: [
      {
        id: 'category-other',
        name: 'その他',
        tags: [{ id: 'tag-other', name: 'その他' }],
      },
    ],
    selectedCategoryIds: [],
    onSelectedCategoryIdsChange: fn(),
    selectedTagIds: [],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('カテゴリーを選択'))
    await expect(canvas.getAllByText('その他')).toHaveLength(1)
    await userEvent.click(canvas.getByRole('checkbox', { name: 'その他' }))
    await expect(args.onSelectedCategoryIdsChange).toHaveBeenCalledWith(['category-other'])
    await expect(args.onSelectedTagIdsChange).toHaveBeenCalledWith(['tag-other'])
  },
}

export const SortedByChildCount: Story = {
  args: {
    ...Default.args,
    categories: [
      { id: 'small', name: '子が1件', tags: [{ id: 'small-1', name: '小項目' }] },
      {
        id: 'large',
        name: '子が3件',
        tags: [
          { id: 'large-1', name: '大項目1' },
          { id: 'large-2', name: '大項目2' },
          { id: 'large-3', name: '大項目3' },
        ],
      },
      {
        id: 'medium',
        name: '子が2件',
        tags: [
          { id: 'medium-1', name: '中項目1' },
          { id: 'medium-2', name: '中項目2' },
        ],
      },
    ],
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('カテゴリーを選択'))
    const parentCheckboxes = ['子が3件', '子が2件', '子が1件'].map((name) =>
      canvas.getByRole('checkbox', { name }),
    )
    await expect(parentCheckboxes[0].compareDocumentPosition(parentCheckboxes[1])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    await expect(parentCheckboxes[1].compareDocumentPosition(parentCheckboxes[2])).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  },
}

export const ChangeTag: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    categories: baseCategories,
    selectedTagIds: ['tag-2'],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('1件選択中'))
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Next.js' }))
    await expect(args.onSelectedTagIdsChange).toHaveBeenLastCalledWith(['tag-2', 'tag-1'])
  },
}

export const ClearTag: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    categories: baseCategories,
    selectedTagIds: ['tag-2'],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('1件選択中'))
    await userEvent.click(canvas.getByRole('checkbox', { name: 'TypeScript' }))
    await expect(args.onSelectedTagIdsChange).toHaveBeenLastCalledWith([])
  },
}

export const CloseOnOutsideClick: Story = {
  args: Default.args,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText('カテゴリーを選択'))
    await expect(canvas.getByRole('checkbox', { name: '技術' })).toBeVisible()
    await userEvent.click(canvas.getByPlaceholderText('キーワードを入力'))
    await expect(canvas.queryByRole('checkbox', { name: '技術' })).not.toBeInTheDocument()
  },
}

export const KeywordInput: Story = {
  args: {
    keyword: '',
    onKeywordChange: fn(),
    categories: baseCategories,
    selectedTagIds: [],
    onSelectedTagIdsChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByPlaceholderText('キーワードを入力'), 'Next')
    await expect(args.onKeywordChange).toHaveBeenCalled()
  },
}
