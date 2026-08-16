'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, type FieldPath, useForm } from 'react-hook-form'
import { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import imageNone from '@/assets/image-none.svg'
import leftImageStep01 from '@/assets/onboarding-left-step01.svg'
import leftImageStep02 from '@/assets/onboarding-left-step02.svg'
import leftImageStep03 from '@/assets/onboarding-left-step03.svg'
import leftImageStep04 from '@/assets/onboarding-left-step04.svg'
import leftImageStep05 from '@/assets/onboarding-left-step05.svg'
import leftImageStep06 from '@/assets/onboarding-left-step06.svg'
import leftImageStep07 from '@/assets/onboarding-left-step07.svg'
import plusRound from '@/assets/plus-round.svg'
import { FormField } from '@/components/design-system/form-field'
import { FormTextarea } from '@/components/design-system/form-textarea'
import { MbtiButton } from '@/components/design-system/mbti-button'
import { MultiSelectButton } from '@/components/design-system/multi-select-button'
import { FormBottomButtons } from '@/components/onboarding/form-bottom-buttons'
import { FormTitleMultiSelect } from '@/components/onboarding/form-title-multi-select'
import { FormTitleRadioButton } from '@/components/onboarding/form-title-radio-button'
import { FormTitleSelect } from '@/components/onboarding/form-title-select'
import { FormTitleSelectRow } from '@/components/onboarding/form-title-select-row'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/hono/client'
import { type OnboardingInput, onboardingSchema } from '@/lib/schemas/onboarding'
import { RegisterImagePanel } from '../register/register-image-panel'
import { RegisterSidePanel } from '../register/register-side-panel'
import { FormTitle } from './form-title'

type Option = { id: string; name: string }
type Options = {
  departments: Option[]
  businessAreas: Option[]
  businessSkills: Option[]
  interests: Option[]
}

const stepFields: FieldPath<OnboardingInput>[][] = [
  ['username', 'departmentId', 'businessAreaId'],
  ['joinedYear', 'joinedMonth', 'businessSkillIds'],
  [],
  ['lunchPreference', 'recommendedLunchSpot'],
  ['bio', 'displayNameColor'],
  [],
  [],
]

const leftImages = [
  leftImageStep01,
  leftImageStep02,
  leftImageStep03,
  leftImageStep04,
  leftImageStep05,
  leftImageStep06,
  leftImageStep07,
]

const lunchChoices = [
  { value: LunchPreference.NO_PREFERENCE, label: 'こだわりない' },
  { value: LunchPreference.TEAM, label: 'チームで' },
  { value: LunchPreference.ALONE, label: '一人で' },
]

const colorChoices = [
  { value: DisplayNameColor.GREEN, label: 'みどり', className: 'text-display-name-green' },
  { value: DisplayNameColor.YELLOW, label: 'きいろ', className: 'text-display-name-yellow' },
  { value: DisplayNameColor.BLUE, label: 'あお', className: 'text-display-name-blue' },
  { value: DisplayNameColor.PURPLE, label: 'むらさき', className: 'text-display-name-purple' },
  { value: DisplayNameColor.GRAY, label: '回答しない', className: 'text-display-name-gray' },
]

const mbtiColorChoices: {
  value: DisplayNameColor
  label: string
  color: 'green' | 'yellow' | 'blue' | 'purple'
}[] = [
  { value: DisplayNameColor.GREEN, label: 'みどり', color: 'green' },
  { value: DisplayNameColor.YELLOW, label: 'きいろ', color: 'yellow' },
  { value: DisplayNameColor.BLUE, label: 'あお', color: 'blue' },
  { value: DisplayNameColor.PURPLE, label: 'むらさき', color: 'purple' },
]

const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) =>
  String(new Date().getFullYear() - index),
)
const months = Array.from({ length: 12 }, (_, index) => String(index + 1))

async function fetchOptions(): Promise<Options> {
  const res = await client.api.onboarding.options.$get()
  if (!res.ok) throw new Error('選択肢の取得に失敗しました')
  return res.json()
}

export function OnboardingForm({ initialUsername = '' }: { initialUsername?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [ibjCareerName, setIbjCareerName] = useState('')
  const {
    data: options,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['onboarding-options'],
    queryFn: fetchOptions,
  })
  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onBlur',
    defaultValues: {
      username: initialUsername,
      departmentId: '',
      businessAreaId: '',
      joinedYear: undefined,
      joinedMonth: undefined,
      businessSkillIds: [],
      interestIds: [],
      lunchPreference: LunchPreference.NO_PREFERENCE,
      recommendedLunchSpot: '',
      bio: '',
    },
  })

  if (isLoading) {
    return <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="読み込み中" />
  }
  if (error || !options)
    return <p className="text-sm text-destructive">選択肢の取得に失敗しました</p>

  async function onSubmit(data: OnboardingInput) {
    setSubmitError(null)
    const res = await client.api.onboarding.$post({ json: data })
    if (!res.ok) {
      const body = await res.json()
      setSubmitError('error' in body ? body.error : '登録に失敗しました')
      return
    }
    router.push('/')
    router.refresh()
  }

  const values = form.watch()
  const findName = (items: Option[], id: string) =>
    items.find((item) => item.id === id)?.name ?? '未選択'
  const findNames = (items: Option[], ids: string[]) => {
    const names = ids
      .map((id) => items.find((item) => item.id === id)?.name)
      .filter((name): name is string => !!name)
    return names.length > 0 ? names : ['未選択']
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background-subtle">
      <RegisterImagePanel image={leftImages[step]} />

      <RegisterSidePanel>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-95 w-full h-150 flex flex-col justify-between pb-8"
        >
          <div className="flex flex-1 flex-col gap-16 items-center">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((step + 1) / 7) * 100}%` }}
              />
            </div>

            {step === 0 && (
              <section className="flex flex-1 flex-col justify-between w-full">
                <FormTitle title="基本情報" description="あとから変更することができます" />

                <div className="space-y-6">
                  <FormField
                    label="ニックネーム"
                    isRequired
                    caption="※10字以内で入力してください。"
                    error={form.formState.errors.username?.message}
                    inputProps={{
                      id: 'username',
                      ...form.register('username'),
                      placeholder: '呼び名を入力する',
                    }}
                    maxLength={10}
                  />

                  <Controller
                    name="departmentId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FormTitleSelect
                        id="department"
                        label="所属部署"
                        isRequired
                        placeholder="所属部署を選択する"
                        options={options.departments}
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                      />
                    )}
                  />

                  <Controller
                    name="businessAreaId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FormTitleSelect
                        id="business-area"
                        label="勤務エリア"
                        isRequired
                        options={options.businessAreas}
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>

                <FormBottomButtons
                  step={step}
                  setStep={setStep}
                  form={form}
                  stepFields={stepFields}
                  isNextDisabled={
                    !values.username || !values.departmentId || !values.businessAreaId
                  }
                />
              </section>
            )}

            {step === 1 && (
              <section className="flex flex-1 flex-col justify-between w-full">
                <FormTitle title="基本情報" description="あとから変更することができます" />

                <div className="space-y-6">
                  <Controller
                    name="joinedYear"
                    control={form.control}
                    render={({ field: yearField, fieldState: yearFieldState }) => (
                      <Controller
                        name="joinedMonth"
                        control={form.control}
                        render={({ field: monthField, fieldState: monthFieldState }) => (
                          <FormTitleSelectRow
                            label="入社年月"
                            isRequired
                            years={years}
                            months={months}
                            yearValue={yearField.value ? String(yearField.value) : ''}
                            monthValue={monthField.value ? String(monthField.value) : ''}
                            onYearChange={(value) => yearField.onChange(Number(value))}
                            onMonthChange={(value) => monthField.onChange(Number(value))}
                            onYearBlur={yearField.onBlur}
                            onMonthBlur={monthField.onBlur}
                            yearError={yearFieldState.error?.message}
                            monthError={monthFieldState.error?.message}
                            placeholder={['2001', '1']}
                            isInfoIcon
                            ibjCareerName={ibjCareerName}
                            setIbjCareerName={setIbjCareerName}
                          />
                        )}
                      />
                    )}
                  />

                  <div className="space-y-2">
                    <Controller
                      name="businessSkillIds"
                      control={form.control}
                      render={({ field }) => (
                        <FormTitleMultiSelect
                          label="ビジネススキル"
                          isRequired
                          options={options.businessSkills}
                          selectedIds={field.value}
                          onToggle={(id) =>
                            field.onChange(
                              field.value.includes(id)
                                ? field.value.filter((selectedId) => selectedId !== id)
                                : [...field.value, id],
                            )
                          }
                        />
                      )}
                    />
                  </div>
                </div>

                <FormBottomButtons
                  step={step}
                  setStep={setStep}
                  form={form}
                  stepFields={stepFields}
                  isNextDisabled={
                    !values.joinedYear ||
                    !values.joinedMonth ||
                    values.businessSkillIds.length === 0
                  }
                />
              </section>
            )}

            {step === 2 && (
              <section className="flex flex-1 flex-col justify-between w-full">
                <FormTitle title="趣味" description="複数選択できます" />

                <div className="space-y-2 h-61 overflow-y-scroll scrollbar-custom">
                  <Controller
                    name="interestIds"
                    control={form.control}
                    render={({ field }) => (
                      <FormTitleMultiSelect
                        options={options.interests}
                        selectedIds={field.value ?? []}
                        onToggle={(id) => {
                          const current = field.value ?? []
                          field.onChange(
                            current.includes(id)
                              ? current.filter((selectedId) => selectedId !== id)
                              : [...current, id],
                          )
                        }}
                        className="mr-[22px]"
                      />
                    )}
                  />
                </div>

                <FormBottomButtons
                  step={step}
                  setStep={setStep}
                  form={form}
                  stepFields={stepFields}
                />
              </section>
            )}

            {step === 3 && (
              <section className="flex flex-1 flex-col justify-between w-full">
                <FormTitle title="ランチ" description="お昼の過ごし方を教えてください" />

                <div className="space-y-6">
                  <Controller
                    name="lunchPreference"
                    control={form.control}
                    render={({ field }) => (
                      <FormTitleRadioButton
                        name="lunch"
                        label="ランチスタイル"
                        options={lunchChoices}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as LunchPreference)}
                      />
                    )}
                  />

                  <FormField
                    label="ランチスポット"
                    caption="※20字以内で入力してください。"
                    inputProps={{
                      id: 'lanch-spot',
                      ...form.register('recommendedLunchSpot'),
                      placeholder: '例：inton',
                    }}
                    maxLength={20}
                  />
                </div>

                <FormBottomButtons
                  step={step}
                  setStep={setStep}
                  form={form}
                  stepFields={stepFields}
                />
              </section>
            )}

            {step === 4 && (
              <section className="flex flex-1 flex-col justify-between w-full">
                <FormTitle title="その他" description="ひとことやMBTIの色を教えてください" />

                <div className="space-y-6">
                  <FormTextarea
                    label="ひとこと"
                    caption="※30字以内で入力してください。"
                    error={form.formState.errors.bio?.message}
                    maxLength={30}
                    textareaProps={{
                      id: 'bio',
                      ...form.register('bio'),
                      placeholder: '例：エンジニアの〇〇です！新しい繋がりを増やしたいです！',
                      rows: 5,
                    }}
                  />

                  <div className="space-y-2">
                    <Label>MBTIの色</Label>
                    <Controller
                      name="displayNameColor"
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-3">
                          {mbtiColorChoices.map((choice) => (
                            <MbtiButton
                              key={choice.value}
                              text={choice.label}
                              color={choice.color}
                              isSelected={field.value === choice.value}
                              onClick={() =>
                                field.onChange(
                                  field.value === choice.value ? undefined : choice.value,
                                )
                              }
                            />
                          ))}

                          <MultiSelectButton
                            text="回答しない"
                            isSelected={field.value === DisplayNameColor.GRAY}
                            onClick={() =>
                              field.onChange(
                                field.value === DisplayNameColor.GRAY
                                  ? undefined
                                  : DisplayNameColor.GRAY,
                              )
                            }
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>

                <FormBottomButtons
                  step={step}
                  setStep={setStep}
                  form={form}
                  stepFields={stepFields}
                />
              </section>
            )}

            {step === 5 && (
              <section className="flex flex-1 flex-col justify-between w-full">
                <FormTitle title="アイコン" description="ひろばでのアイコン写真を設定しましょう" />

                <div className="flex items-center justify-center">
                  <div className="relative size-40.5">
                    <Image
                      src={imageNone}
                      alt=""
                      width={162}
                      height={162}
                      className="object-cover"
                    />
                    <Image
                      src={plusRound}
                      alt=""
                      width={48}
                      height={48}
                      className="absolute -right-5 bottom-5"
                    />
                  </div>
                </div>

                <FormBottomButtons
                  step={step}
                  setStep={setStep}
                  form={form}
                  stepFields={stepFields}
                  rightLabel="確認へ進む"
                />
              </section>
            )}

            {step === 6 && (
              <section className="flex flex-1 flex-col justify-between w-full">
                <FormTitle
                  title="登録内容の確認"
                  description="以下の内容で登録してよろしいでしょうか"
                />

                <dl className="grid gap-x-4 gap-y-4 h-73 overflow-y-scroll scrollbar-custom grid-cols-[100px_1fr] pr-2 ">
                  <dt className="text-label text-foreground font-bold">ニックネーム</dt>
                  <dd className="text-body-small text-foreground">{values.username}</dd>

                  <dt className="text-label text-foreground font-bold">所属部署</dt>
                  <dd className="text-body-small text-foreground">
                    {findName(options.departments, values.departmentId)}
                  </dd>

                  <dt className="text-label text-foreground font-bold">勤務エリア</dt>
                  <dd className="text-body-small text-foreground">
                    {findName(options.businessAreas, values.businessAreaId)}
                  </dd>

                  <dt className="text-label text-foreground font-bold">入社年月</dt>
                  <dd className="text-body-small text-foreground">
                    {values.joinedYear}年{values.joinedMonth}月
                  </dd>

                  <dt className="text-label text-foreground font-bold">ビジネススキル</dt>
                  <dd className="text-body-small text-foreground">
                    {findNames(options.businessSkills, values.businessSkillIds).map((name) => (
                      <p key={name}>{name}</p>
                    ))}
                  </dd>

                  <dt className="text-label text-foreground font-bold">趣味</dt>
                  <dd className="text-body-small text-foreground">
                    {findNames(options.interests, values.interestIds ?? []).join(' ')}
                  </dd>

                  <dt className="text-label text-foreground font-bold">ランチスタイル</dt>
                  <dd className="text-body-small text-foreground">
                    {lunchChoices.find((item) => item.value === values.lunchPreference)?.label}
                  </dd>

                  <dt className="text-label text-foreground font-bold">おすすめランチスポット</dt>
                  <dd className="text-body-small text-foreground">
                    {values.recommendedLunchSpot || '未入力'}
                  </dd>

                  <dt className="text-label text-foreground font-bold">ひとこと</dt>
                  <dd className="text-body-small text-foreground whitespace-pre-wrap">
                    {values.bio || '未入力'}
                  </dd>

                  <dt className="text-label text-foreground font-bold">MBTIの色</dt>
                  <dd className="text-body-small text-foreground">
                    {colorChoices.find((item) => item.value === values.displayNameColor)?.label ??
                      '未選択'}
                  </dd>

                  <dt className="text-label text-foreground font-bold">アイコン</dt>
                  <dd className="text-body-small text-foreground">未設定</dd>
                </dl>
                {submitError && <p className="text-sm text-destructive">{submitError}</p>}

                <FormBottomButtons
                  step={step}
                  setStep={setStep}
                  form={form}
                  stepFields={stepFields}
                  rightLabel="登録を完了"
                />
              </section>
            )}
          </div>
        </form>
      </RegisterSidePanel>
    </div>
  )
}
