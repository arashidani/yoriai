import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'
import { OnboardingForm } from './onboarding-form'

const meta = {
  component: OnboardingForm,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof OnboardingForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { initialUsername: 'みどりさん' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByDisplayValue('みどりさん')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '次へ' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '戻る' })).toBeNull()
  },
}

export const ValidationErrors: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole('button', { name: '次へ' }))
    await expect(await canvas.findByText('ニックネームを入力してください')).toBeVisible()
    await expect(canvas.getByText('所属部署を選択してください')).toBeVisible()
    await expect(canvas.getByText('業務エリアを選択してください')).toBeVisible()
  },
}

export const SelectedOptionLabels: Story = {
  play: async ({ canvas }) => {
    const department = await canvas.findByLabelText('所属部署')
    await userEvent.click(department)
    await userEvent.click(await within(document.body).findByRole('option', { name: '開発部' }))
    await expect(department).toHaveTextContent('開発部')
    await expect(department).not.toHaveTextContent('department-1')

    const businessArea = canvas.getByLabelText('業務エリア')
    await userEvent.click(businessArea)
    await userEvent.click(
      await within(document.body).findByRole('option', { name: 'プロダクト開発' }),
    )
    await expect(businessArea).toHaveTextContent('プロダクト開発')
    await expect(businessArea).not.toHaveTextContent('business-area-1')
  },
}
