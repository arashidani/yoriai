import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { IconAi } from '@/components/design-system/icons/icon-ai'
import { Loading } from './loading'

const meta = {
  component: Loading,
} satisfies Meta<typeof Loading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const status = canvas.getByRole('status')
    await expect(status).toBeVisible()
    await expect(status).toHaveTextContent('よりあいぬが考え中')
    // Figma: unofficial/surface = #ffffff, muted/muted-foreground = #a59a8d
    await expect(status).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' })
    await expect(canvas.getByText('よりあいぬが考え中')).toHaveStyle({
      color: 'rgb(165, 154, 141)',
    })
  },
}

export const CustomText: Story = {
  args: {
    children: '回答を組み立て中',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('回答を組み立て中')
  },
}

export const WithLeftIcon: Story = {
  args: {
    leftIcon: <IconAi className="size-4" />,
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('status')).toBeVisible()
    await expect(canvasElement.querySelector('svg')).toBeInTheDocument()
  },
}

export const OnChatBackground: Story = {
  render: () => (
    <div className="flex w-[420px] bg-background-subtle p-4">
      <Loading />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toBeVisible()
  },
}
