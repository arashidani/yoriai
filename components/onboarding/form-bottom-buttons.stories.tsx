import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { expect, userEvent } from 'storybook/test'
import type { OnboardingInput } from '@/lib/schemas/onboarding'
import { FormBottomButtons } from './form-bottom-buttons'

const stepFields: Parameters<typeof FormBottomButtons>[0]['stepFields'] = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
]

function FormBottomButtonsHarness({
  initialStep,
  isNextDisabled,
}: {
  initialStep: number
  isNextDisabled?: boolean
}) {
  const [step, setStep] = useState(initialStep)
  const form = useForm<OnboardingInput>()

  return (
    <FormBottomButtons
      step={step}
      setStep={setStep}
      form={form}
      stepFields={stepFields}
      isNextDisabled={isNextDisabled}
    />
  )
}

const meta = {
  component: FormBottomButtonsHarness,
  args: { initialStep: 0 },
} satisfies Meta<typeof FormBottomButtonsHarness>

export default meta
type Story = StoryObj<typeof meta>

export const FirstStep: Story = {
  args: { initialStep: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: '戻る' })).toBeNull()
    await expect(canvas.getByRole('button', { name: '次へ' })).toBeVisible()
  },
}

export const MiddleStep: Story = {
  args: { initialStep: 3 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '戻る' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '次へ' })).toBeVisible()
  },
}

export const LastStep: Story = {
  args: { initialStep: 6 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '戻る' })).toBeVisible()
    const submitButton = canvas.getByRole('button', { name: '次へ' })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toHaveAttribute('type', 'submit')
  },
}

export const NextDisabled: Story = {
  args: { initialStep: 0, isNextDisabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '次へ' })).toBeDisabled()
  },
}

export const GoNext: Story = {
  args: { initialStep: 0 },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: '次へ' }))
    await expect(await canvas.findByRole('button', { name: '戻る' })).toBeVisible()
  },
}
