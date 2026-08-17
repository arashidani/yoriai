'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, type FieldPath, useForm } from 'react-hook-form'
import { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { client } from '@/lib/hono/client'
import { type OnboardingInput, onboardingSchema } from '@/lib/schemas/onboarding'
import { cn } from '@/lib/utils'

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
  ['interestIds'],
  ['lunchPreference', 'recommendedLunchSpot'],
  ['bio', 'displayNameColor'],
  [],
  [],
]

const lunchChoices = [
  { value: LunchPreference.NO_PREFERENCE, label: 'こだわりない' },
  { value: LunchPreference.TEAM, label: 'チームで' },
  { value: LunchPreference.ALONE, label: '一人で' },
]

const colorChoices = [
  { value: DisplayNameColor.GREEN, label: '緑', className: 'text-display-name-green' },
  { value: DisplayNameColor.YELLOW, label: '黄色', className: 'text-display-name-yellow' },
  { value: DisplayNameColor.BLUE, label: '青', className: 'text-display-name-blue' },
  { value: DisplayNameColor.PURPLE, label: '紫', className: 'text-display-name-purple' },
  { value: DisplayNameColor.GRAY, label: '回答しない', className: 'text-display-name-gray' },
]

const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) =>
  String(new Date().getFullYear() - index),
)

async function fetchOptions(): Promise<Options> {
  const res = await client.api.onboarding.options.$get()
  if (!res.ok) throw new Error('選択肢の取得に失敗しました')
  return res.json()
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

function CheckboxList({
  name,
  options,
  control,
  error,
}: {
  name: 'businessSkillIds' | 'interestIds'
  options: Option[]
  control: ReturnType<typeof useForm<OnboardingInput>>['control']
  error?: string
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((option) => {
              const checked = field.value.includes(option.id)
              return (
                <label
                  key={option.id}
                  htmlFor={`${name}-${option.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-input p-4"
                >
                  <Checkbox
                    id={`${name}-${option.id}`}
                    checked={checked}
                    onCheckedChange={(nextChecked) =>
                      field.onChange(
                        nextChecked
                          ? [...field.value, option.id]
                          : field.value.filter((id) => id !== option.id),
                      )
                    }
                  />
                  <span className="text-paragraph-small">{option.name}</span>
                </label>
              )
            })}
          </div>
          <FieldError message={error} />
        </div>
      )}
    />
  )
}

export function OnboardingForm({
  initialUsername = '',
  initialAvatarUrl = null,
}: {
  initialUsername?: string
  initialAvatarUrl?: string | null
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
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
      displayNameColor: DisplayNameColor.GRAY,
    },
  })

  if (isLoading) {
    return <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="読み込み中" />
  }
  if (error || !options)
    return <p className="text-sm text-destructive">選択肢の取得に失敗しました</p>

  async function goNext() {
    if (await form.trigger(stepFields[step])) setStep((current) => Math.min(current + 1, 6))
  }

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
    items.find((item) => item.id === id)?.name ?? '—'
  const findNames = (items: Option[], ids: string[]) =>
    ids.map((id) => findName(items, id)).join('、') || '—'

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-8">
      <header className="space-y-2">
        <p className="text-caption text-muted-foreground">{step + 1} / 7</p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((step + 1) / 7) * 100}%` }}
          />
        </div>
      </header>

      {step === 0 && (
        <section className="space-y-6">
          <h1 className="text-heading-2">まずは基本情報を教えてください</h1>
          <div className="space-y-2">
            <Label htmlFor="username">ニックネーム</Label>
            <Input
              id="username"
              {...form.register('username')}
              aria-invalid={!!form.formState.errors.username}
            />
            <FieldError message={form.formState.errors.username?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="departmentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="department">所属部署</Label>
                  <Select
                    items={options.departments.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="department"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.departments.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldState.error?.message} />
                </div>
              )}
            />
            <Controller
              name="businessAreaId"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="business-area">業務エリア</Label>
                  <Select
                    items={options.businessAreas.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="business-area"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.businessAreas.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldState.error?.message} />
                </div>
              )}
            />
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <h1 className="text-heading-2">入社年月とスキル</h1>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="joinedYear"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="joined-year">入社年</Label>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger
                      id="joined-year"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldState.error?.message} />
                </div>
              )}
            />
            <Controller
              name="joinedMonth"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="joined-month">入社月</Label>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger
                      id="joined-month"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldState.error?.message} />
                </div>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>ビジネススキル</Label>
            <CheckboxList
              name="businessSkillIds"
              options={options.businessSkills}
              control={form.control}
              error={form.formState.errors.businessSkillIds?.message}
            />
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <h1 className="text-heading-2">興味のあること</h1>
          <CheckboxList
            name="interestIds"
            options={options.interests}
            control={form.control}
            error={form.formState.errors.interestIds?.message}
          />
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <h1 className="text-heading-2">ランチタイムについて</h1>
          <Controller
            name="lunchPreference"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-3 sm:grid-cols-3"
              >
                {lunchChoices.map((choice) => (
                  <label
                    key={choice.value}
                    htmlFor={`lunch-${choice.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-input p-4"
                  >
                    <RadioGroupItem id={`lunch-${choice.value}`} value={choice.value} />
                    {choice.label}
                  </label>
                ))}
              </RadioGroup>
            )}
          />
          <div className="space-y-2">
            <Label htmlFor="lunch-spot">おすすめランチスポット（任意）</Label>
            <Input id="lunch-spot" maxLength={20} {...form.register('recommendedLunchSpot')} />
            <FieldError message={form.formState.errors.recommendedLunchSpot?.message} />
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-6">
          <h1 className="text-heading-2">あなたらしさを教えてください</h1>
          <div className="space-y-2">
            <Label htmlFor="bio">一言（任意）</Label>
            <Textarea id="bio" maxLength={200} rows={5} {...form.register('bio')} />
            <p className="text-caption text-muted-foreground">{values.bio?.length ?? 0} / 200</p>
            <FieldError message={form.formState.errors.bio?.message} />
          </div>
          <div className="space-y-2">
            <Label>MBTI色</Label>
            <Controller
              name="displayNameColor"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid gap-3 sm:grid-cols-5"
                >
                  {colorChoices.map((choice) => (
                    <label
                      key={choice.value}
                      htmlFor={`color-${choice.value}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-input p-3"
                    >
                      <RadioGroupItem id={`color-${choice.value}`} value={choice.value} />
                      <span className={cn('font-bold', choice.className)}>{choice.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="flex min-h-72 flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-input p-8 text-center">
          <h1 className="text-heading-2">アイコン設定</h1>
          <AvatarUpload avatarUrl={avatarUrl} onAvatarUrlChange={setAvatarUrl} />
        </section>
      )}

      {step === 6 && (
        <section className="space-y-6">
          <h1 className="text-heading-2">登録内容の確認</h1>
          <dl className="grid gap-4 rounded-xl border border-input p-6 sm:grid-cols-[12rem_1fr]">
            <dt className="font-bold">ニックネーム</dt>
            <dd
              className={
                colorChoices.find((item) => item.value === values.displayNameColor)?.className
              }
            >
              {values.username}
            </dd>
            <dt className="font-bold">所属部署</dt>
            <dd>{findName(options.departments, values.departmentId)}</dd>
            <dt className="font-bold">業務エリア</dt>
            <dd>{findName(options.businessAreas, values.businessAreaId)}</dd>
            <dt className="font-bold">入社年月</dt>
            <dd>
              {values.joinedYear}年{values.joinedMonth}月
            </dd>
            <dt className="font-bold">ビジネススキル</dt>
            <dd>{findNames(options.businessSkills, values.businessSkillIds)}</dd>
            <dt className="font-bold">興味</dt>
            <dd>{findNames(options.interests, values.interestIds)}</dd>
            <dt className="font-bold">ランチタイム</dt>
            <dd>{lunchChoices.find((item) => item.value === values.lunchPreference)?.label}</dd>
            <dt className="font-bold">おすすめランチスポット</dt>
            <dd>{values.recommendedLunchSpot || '未入力'}</dd>
            <dt className="font-bold">一言</dt>
            <dd className="whitespace-pre-wrap">{values.bio || '未入力'}</dd>
            <dt className="font-bold">MBTI色</dt>
            <dd>{colorChoices.find((item) => item.value === values.displayNameColor)?.label}</dd>
            <dt className="font-bold">アイコン</dt>
            <dd>{avatarUrl ? '設定済み' : '未設定'}</dd>
          </dl>
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        </section>
      )}

      <footer className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
            戻る
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {step === 5 && (
            <Button type="button" variant="ghost" onClick={goNext}>
              スキップ
            </Button>
          )}
          {step < 6 ? (
            <Button type="button" onClick={goNext}>
              次へ
            </Button>
          ) : (
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '登録中...' : '登録する'}
            </Button>
          )}
        </div>
      </footer>
    </form>
  )
}
