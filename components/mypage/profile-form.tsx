'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { type Control, Controller, useForm } from 'react-hook-form'
import { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { type UpdateProfileInput, updateProfileSchema } from '@/lib/schemas/profile'
import { cn } from '@/lib/utils'

type Option = { id: string; name: string }
type Options = {
  departments: Option[]
  businessAreas: Option[]
  businessSkills: Option[]
  interests: Option[]
}

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

async function fetchProfile() {
  const res = await client.api.users.me.$get()
  if (!res.ok) throw new Error('プロフィールの取得に失敗しました')
  const { user } = await res.json()
  return user
}

async function fetchOptions(): Promise<Options> {
  const res = await client.api.onboarding.options.$get()
  if (!res.ok) throw new Error('選択肢の取得に失敗しました')
  return res.json()
}

async function saveProfile(data: UpdateProfileInput) {
  const res = await client.api.users.me.$patch({ json: data })
  if (!res.ok) {
    const body = await res.json()
    throw new Error('error' in body ? body.error : 'プロフィールの更新に失敗しました')
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-paragraph-small text-destructive">{message}</p> : null
}

function CheckboxList({
  name,
  options,
  control,
  error,
}: {
  name: 'businessSkillIds' | 'interestIds'
  options: Option[]
  control: Control<UpdateProfileInput>
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
              const selectedIds = field.value ?? []
              const checked = selectedIds.includes(option.id)
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
                          ? [...selectedIds, option.id]
                          : selectedIds.filter((id) => id !== option.id),
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

export function ProfileForm() {
  const profileQuery = useQuery({ queryKey: ['users', 'me'], queryFn: fetchProfile })
  const optionsQuery = useQuery({ queryKey: ['onboarding-options'], queryFn: fetchOptions })

  if (profileQuery.isPending || optionsQuery.isPending) {
    return <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="読み込み中" />
  }

  if (profileQuery.error || optionsQuery.error) {
    return <p className="text-paragraph-small text-destructive">プロフィールの取得に失敗しました</p>
  }

  return <ProfileEditor profile={profileQuery.data} options={optionsQuery.data} />
}

function ProfileEditor({
  profile,
  options,
}: {
  profile: Awaited<ReturnType<typeof fetchProfile>>
  options: Options
}) {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile.name ?? '',
      username: profile.username ?? '',
      departmentId: profile.departmentId ?? '',
      businessAreaId: profile.businessAreaId ?? '',
      joinedYear: profile.joinedYear ?? undefined,
      joinedMonth: profile.joinedMonth ?? undefined,
      businessSkillIds: profile.businessSkillIds,
      interestIds: profile.interestIds,
      lunchPreference: profile.lunchPreference ?? LunchPreference.NO_PREFERENCE,
      recommendedLunchSpot: profile.recommendedLunchSpot ?? '',
      bio: profile.bio ?? '',
      displayNameColor: profile.displayNameColor ?? DisplayNameColor.GRAY,
    },
  })
  const mutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: async () => {
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
    onError: () => setSaved(false),
  })
  const bio = form.watch('bio')

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        setSaved(false)
        mutation.mutate(data)
      })}
      className="space-y-6"
    >
      <Card>
        <CardContent className="space-y-6 p-6">
          <fieldset className="space-y-4">
            <legend className="text-heading-4">基本情報</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" value={profile.email} disabled />
                <p className="text-caption text-muted-foreground">
                  メールアドレスは変更できません。
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">氏名</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  aria-invalid={!!form.formState.errors.name}
                />
                <FieldError message={form.formState.errors.name?.message} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="username">ニックネーム</Label>
                <Input
                  id="username"
                  {...form.register('username')}
                  aria-invalid={!!form.formState.errors.username}
                />
                <FieldError message={form.formState.errors.username?.message} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-border pt-6">
            <legend className="text-heading-4">所属・入社情報</legend>
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
                        {Array.from({ length: 12 }, (_, index) => String(index + 1)).map(
                          (month) => (
                            <SelectItem key={month} value={month}>
                              {month}月
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FieldError message={fieldState.error?.message} />
                  </div>
                )}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-border pt-6">
            <legend className="text-heading-4">ビジネススキル</legend>
            <CheckboxList
              name="businessSkillIds"
              options={options.businessSkills}
              control={form.control}
              error={form.formState.errors.businessSkillIds?.message}
            />
          </fieldset>

          <fieldset className="space-y-4 border-t border-border pt-6">
            <legend className="text-heading-4">興味のあること</legend>
            <CheckboxList
              name="interestIds"
              options={options.interests}
              control={form.control}
              error={form.formState.errors.interestIds?.message}
            />
          </fieldset>

          <fieldset className="space-y-4 border-t border-border pt-6">
            <legend className="text-heading-4">ランチタイム</legend>
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
                      htmlFor={`profile-lunch-${choice.value}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-input p-4"
                    >
                      <RadioGroupItem id={`profile-lunch-${choice.value}`} value={choice.value} />
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
          </fieldset>

          <fieldset className="space-y-4 border-t border-border pt-6">
            <legend className="text-heading-4">自己紹介</legend>
            <div className="space-y-2">
              <Label htmlFor="bio">一言（任意）</Label>
              <Textarea id="bio" maxLength={200} rows={5} {...form.register('bio')} />
              <p className="text-caption text-muted-foreground">{bio?.length ?? 0} / 200</p>
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
                        htmlFor={`profile-color-${choice.value}`}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-input p-3"
                      >
                        <RadioGroupItem id={`profile-color-${choice.value}`} value={choice.value} />
                        <span className={cn('font-bold', choice.className)}>{choice.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-4">
        {saved && (
          <p className="text-paragraph-small" role="status">
            プロフィールを更新しました。
          </p>
        )}
        {mutation.error && (
          <p className="text-paragraph-small text-destructive" role="alert">
            {mutation.error.message}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? '保存中...' : '変更を保存'}
        </Button>
      </div>
    </form>
  )
}
