import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FormTitleSelectRow } from './form-title-select-row'

const years = ['2020', '2021', '2022', '2023', '2024']
const months = Array.from({ length: 12 }, (_, i) => String(i + 1))

const meta = {
  component: FormTitleSelectRow,
  args: {
    label: '入社年月',
    years,
    months,
    yearValue: '',
    monthValue: '',
    onYearChange: fn(),
    onMonthChange: fn(),
    setIbjCareerName: fn(),
    ibjCareerName: '',
  },
} satisfies Meta<typeof FormTitleSelectRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('入社年月')).toBeVisible()
    await expect(canvas.getAllByText('選択してください')).toHaveLength(2)
  },
}

export const WithError: Story = {
  args: {
    yearError: '入社年を選択してください',
    monthError: '入社月を選択してください',
  },
  play: async ({ canvas }) => {
    const comboboxes = canvas.getAllByRole('combobox')
    await expect(comboboxes[0]).toHaveAttribute('aria-invalid', 'true')
    await expect(comboboxes[1]).toHaveAttribute('aria-invalid', 'true')
  },
}

export const WithCareerName: Story = {
  args: {
    yearValue: '2022',
    monthValue: '4',
    ibjCareerName: '番長',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('あなたは番長です。')).toBeVisible()
  },
}

function ControlledFormTitleSelectRow() {
  const [yearValue, setYearValue] = useState('')
  const [monthValue, setMonthValue] = useState('')
  const [ibjCareerName, setIbjCareerName] = useState('')

  return (
    <FormTitleSelectRow
      label="入社年月"
      years={years}
      months={months}
      yearValue={yearValue}
      monthValue={monthValue}
      onYearChange={setYearValue}
      onMonthChange={setMonthValue}
      setIbjCareerName={setIbjCareerName}
      ibjCareerName={ibjCareerName}
    />
  )
}

export const SelectUpdatesCareerName: Story = {
  render: () => <ControlledFormTitleSelectRow />,
  play: async ({ canvas }) => {
    const comboboxes = canvas.getAllByRole('combobox')
    await userEvent.click(comboboxes[0])
    await userEvent.click(await within(document.body).findByRole('option', { name: '2020' }))

    await userEvent.click(canvas.getAllByRole('combobox')[1])
    await userEvent.click(await within(document.body).findByRole('option', { name: '4' }))

    await expect(await canvas.findByText(/あなたは.+です。/)).toBeVisible()
  },
}
