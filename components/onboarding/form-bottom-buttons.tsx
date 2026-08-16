import type { Dispatch, SetStateAction } from 'react'
import type { FieldPath, UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/design-system/button'
import { SecondaryButton } from '@/components/design-system/secondary-button'
import type { OnboardingInput } from '@/lib/schemas/onboarding'

const FIRST_STEP = 0
const LAST_STEP = 6

type FormBottomButtonsProps = {
  step: number
  setStep: Dispatch<SetStateAction<number>>
  form: UseFormReturn<OnboardingInput>
  stepFields: FieldPath<OnboardingInput>[][]
  isNextDisabled?: boolean
  rightLabel?: string
}

export function FormBottomButtons({
  step,
  setStep,
  form,
  stepFields,
  isNextDisabled = false,
  rightLabel = '次へ',
}: FormBottomButtonsProps) {
  async function goNext() {
    if (await form.trigger(stepFields[step])) setStep((current) => Math.min(current + 1, LAST_STEP))
  }

  function goBack() {
    setStep((current) => current - 1)
  }

  const isLastStep = step === LAST_STEP
  const isFirstStep = step === FIRST_STEP

  return (
    <div className="flex gap-2 w-full">
      {!isFirstStep && <SecondaryButton className="w-24.25" onClick={goBack} />}

      {isLastStep ? (
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '登録中...' : rightLabel}
        </Button>
      ) : (
        <Button type="button" onClick={goNext} isDisabled={isNextDisabled}>
          {rightLabel}
        </Button>
      )}
    </div>
  )
}
