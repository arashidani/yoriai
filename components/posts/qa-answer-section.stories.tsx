import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ComponentProps } from 'react'
import { expect, fn } from 'storybook/test'
import { AnswerForm } from '@/components/design-system/ui/answer-form'
import { QaAnswerSection } from './qa-answer-section'

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]

const meta = {
  component: QaAnswerSection,
  args: {
    canAnswer: true,
    children: <AnswerForm onSubmit={fn((event: FormSubmitEvent) => event.preventDefault())} />,
  },
} satisfies Meta<typeof QaAnswerSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('回答を入力する')).toBeVisible()
    await expect(
      canvas.getByText('1週間経過後、一番いいねが多い回答にはにくきゅうバッジが付与されます。'),
    ).toBeVisible()
    await expect(canvas.getByText('※回答にはIBJ歴が表示されます。')).toBeVisible()
  },
}

export const Resolved: Story = {
  args: { canAnswer: false },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('この質問は投稿者が解決済みに変更したため回答はできません。'),
    ).toBeVisible()
    await expect(canvas.queryByPlaceholderText('回答を入力する')).not.toBeInTheDocument()
    await expect(canvas.queryByText('※回答にはIBJ歴が表示されます。')).not.toBeInTheDocument()
    await expect(
      canvas.queryByText('1週間経過後、一番いいねが多い回答にはにくきゅうバッジが付与されます。'),
    ).not.toBeInTheDocument()
  },
}
