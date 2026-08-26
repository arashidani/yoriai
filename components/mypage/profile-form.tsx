'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { type Control, Controller, type UseFormReturn, useForm } from 'react-hook-form'
import { DisplayNameColor, LunchPreference } from '@/app/generated/prisma/enums'
import badge from '@/assets/badge-secondary-foreground.svg'
import bubble from '@/assets/bubble-secondary-foreground.svg'
import human from '@/assets/human-secondary-foreground.svg'
import pen from '@/assets/pen-white.svg'
import { client } from '@/lib/hono/client'
import { type UpdateProfileInput, updateProfileSchema } from '@/lib/schemas/profile'
import { Button } from '../design-system/button'
import { FormField } from '../design-system/form-field'
import { FormSelect } from '../design-system/form-select'
import { FormTextarea } from '../design-system/form-textarea'
import { MbtiButton } from '../design-system/mbti-button'
import { MultiSelectButton } from '../design-system/multi-select-button'
import { RadioButton } from '../design-system/radio-button'
import { TenureChip } from '../design-system/ui/tenure-chip'
import { FormTitleMultiSelect } from '../onboarding/form-title-multi-select'
import { FormTitleSelectRow, getIbjCareerName } from '../onboarding/form-title-select-row'
import { ActivityHistory, type ActivityItem } from './activity-history'
import { ProfileAvatar } from './profile-avatar'
import { ProfileEditField } from './profile-edit-field'
import { ProfileField } from './profile-field'

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

const mbtiColorChoices = [
  { value: DisplayNameColor.GREEN, text: 'みどり', color: 'green' as const },
  { value: DisplayNameColor.YELLOW, text: 'きいろ', color: 'yellow' as const },
  { value: DisplayNameColor.BLUE, text: 'あお', color: 'blue' as const },
  { value: DisplayNameColor.PURPLE, text: 'むらさき', color: 'purple' as const },
]

const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 'activity-1', icon: badge, text: 'ひろばに10回参加を達成しました', time: '2時間前' },
  {
    id: 'activity-2',
    icon: bubble,
    text: 'チームビルディングについて質問しました',
    time: '2時間前',
  },
  { id: 'activity-3', icon: human, text: '料理に参加しました', time: '2時間前' },
  { id: 'activity-4', icon: human, text: '料理に参加しました', time: '2時間前' },
  {
    id: 'activity-5',
    icon: bubble,
    text: 'チームビルディングについて質問しました',
    time: '2時間前',
  },
]

const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) =>
  String(new Date().getFullYear() - index),
)
const months = Array.from({ length: 12 }, (_, index) => String(index + 1))

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

function MultiSelectList({
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
      render={({ field }) => {
        const selectedIds = field.value ?? []
        return (
          <div className="flex-1">
            <FormTitleMultiSelect
              options={options}
              selectedIds={selectedIds}
              onToggle={(id) =>
                field.onChange(
                  selectedIds.includes(id)
                    ? selectedIds.filter((selectedId) => selectedId !== id)
                    : [...selectedIds, id],
                )
              }
            />
            <FieldError message={error} />
          </div>
        )
      }}
    />
  )
}

export function ProfileView({
  profile,
  options,
  avatarUrl,
}: {
  profile: Awaited<ReturnType<typeof fetchProfile>>
  options: Options
  avatarUrl: string | null
}) {
  const departmentName = options.departments.find((item) => item.id === profile.departmentId)?.name
  const businessAreaName = options.businessAreas.find(
    (item) => item.id === profile.businessAreaId,
  )?.name
  const businessSkillNames = options.businessSkills.filter((item) =>
    profile.businessSkillIds.includes(item.id),
  )
  const interestNames = options.interests.filter((item) => profile.interestIds.includes(item.id))
  const lunchLabel = lunchChoices.find((choice) => choice.value === profile.lunchPreference)?.label
  const mbtiLabel =
    profile.displayNameColor === DisplayNameColor.GRAY
      ? '回答しない'
      : mbtiColorChoices.find((choice) => choice.value === profile.displayNameColor)?.text

  return (
    <div className="flex gap-8">
      <ProfileAvatar avatarUrl={avatarUrl} />

      <div className="flex-1">
        <ProfileField label="ニックネーム" value={profile.username || '未入力'} />

        <ProfileField label="所属部署" value={departmentName ?? '未選択'} />

        <ProfileField label="勤務エリア" value={businessAreaName ?? '未選択'} />

        <div className="flex items-center gap-2">
          <ProfileField
            label="入社年月"
            value={
              profile.joinedYear && profile.joinedMonth
                ? `${profile.joinedYear}年 ${profile.joinedMonth}月`
                : '未選択'
            }
          />
          <TenureChip size="default">IBJ歴</TenureChip>
        </div>

        <ProfileField
          label="ビジネススキル"
          value={
            businessSkillNames.length > 0 ? businessSkillNames.map((item) => item.name) : '未選択'
          }
        />

        <ProfileField
          label="趣味"
          value={interestNames.length > 0 ? interestNames.map((item) => item.name) : '未選択'}
        />

        <ProfileField label="ランチスタイル" value={lunchLabel ?? '未選択'} />

        <ProfileField label="ランチスポット" value={profile.recommendedLunchSpot || '未入力'} />

        <ProfileField label="ひとこと" value={profile.bio ? profile.bio.split('\n') : '未入力'} />

        <ProfileField label="MBTIの色" value={mbtiLabel ?? '未選択'} />
      </div>
    </div>
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

  return <ProfileContainer profile={profileQuery.data} options={optionsQuery.data} />
}

function ProfileEditForm({
  form,
  options,
  mutation,
  avatarUrl,
  onAvatarUrlChange,
  ibjCareerName,
  setIbjCareerName,
  onSubmit,
}: {
  form: UseFormReturn<UpdateProfileInput>
  options: Options
  mutation: UseMutationResult<void, Error, UpdateProfileInput>
  avatarUrl: string | null
  onAvatarUrlChange: (avatarUrl: string | null) => void
  ibjCareerName: string
  setIbjCareerName: Dispatch<SetStateAction<string>>
  onSubmit: (data: UpdateProfileInput) => void
}) {
  return (
    <form id="profile-edit-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex gap-8">
        <ProfileAvatar avatarUrl={avatarUrl} onAvatarUrlChange={onAvatarUrlChange} isEditable />

        <div className="flex-1">
          <ProfileEditField label="ニックネーム" htmlFor="username">
            <FormField
              error={form.formState.errors.username?.message}
              inputProps={{
                id: 'username',
                ...form.register('username'),
                className: 'flex-1',
              }}
            />
          </ProfileEditField>

          <Controller
            name="departmentId"
            control={form.control}
            render={({ field, fieldState }) => (
              <ProfileEditField label="所属部署" htmlFor="department">
                <div className="flex-1">
                  <FormSelect
                    id="department"
                    options={options.departments}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                  <FieldError message={fieldState.error?.message} />
                </div>
              </ProfileEditField>
            )}
          />

          <Controller
            name="businessAreaId"
            control={form.control}
            render={({ field, fieldState }) => (
              <ProfileEditField label="勤務エリア" htmlFor="business-area">
                <div className="flex-1">
                  <FormSelect
                    id="business-area"
                    options={options.businessAreas}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                  <FieldError message={fieldState.error?.message} />
                </div>
              </ProfileEditField>
            )}
          />

          <Controller
            name="joinedYear"
            control={form.control}
            render={({ field: yearField, fieldState: yearFieldState }) => (
              <Controller
                name="joinedMonth"
                control={form.control}
                render={({ field: monthField, fieldState: monthFieldState }) => (
                  <ProfileEditField label="入社年月">
                    <div className="flex-1">
                      <FormTitleSelectRow
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
                        ibjCareerName={ibjCareerName}
                        setIbjCareerName={setIbjCareerName}
                        wrapperHeightClassName="h-auto"
                      />
                    </div>
                  </ProfileEditField>
                )}
              />
            )}
          />

          <ProfileEditField label="ビジネススキル">
            <MultiSelectList
              name="businessSkillIds"
              options={options.businessSkills}
              control={form.control}
              error={form.formState.errors.businessSkillIds?.message}
            />
          </ProfileEditField>

          <ProfileEditField label="趣味">
            <MultiSelectList
              name="interestIds"
              options={options.interests}
              control={form.control}
            />
          </ProfileEditField>

          <ProfileEditField label="ランチスタイル">
            <Controller
              name="lunchPreference"
              control={form.control}
              render={({ field }) => (
                <RadioButton
                  name="lunch-preference"
                  options={lunchChoices}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          </ProfileEditField>

          <ProfileEditField label="ランチスポット" htmlFor="lunch-spot">
            <FormField
              error={form.formState.errors.recommendedLunchSpot?.message}
              inputProps={{
                id: 'lunch-spot',
                ...form.register('recommendedLunchSpot'),
                className: 'flex-1',
              }}
              maxLength={20}
            />
          </ProfileEditField>

          <ProfileEditField label="ひとこと" htmlFor="bio">
            <div className="flex-1">
              <FormTextarea
                error={form.formState.errors.bio?.message}
                maxLength={30}
                textareaProps={{ id: 'bio', rows: 5, ...form.register('bio') }}
              />
              <FieldError message={form.formState.errors.bio?.message} />
            </div>
          </ProfileEditField>

          <ProfileEditField label="MBTIの色">
            <Controller
              name="displayNameColor"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-1 flex-wrap gap-3">
                  {mbtiColorChoices.map((choice) => (
                    <MbtiButton
                      key={choice.value}
                      text={choice.text}
                      color={choice.color}
                      isSelected={field.value === choice.value}
                      onClick={() => field.onChange(choice.value)}
                    />
                  ))}
                  <MultiSelectButton
                    text="回答しない"
                    isSelected={field.value === DisplayNameColor.GRAY}
                    onClick={() => field.onChange(DisplayNameColor.GRAY)}
                  />
                </div>
              )}
            />
          </ProfileEditField>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4 pt-6">
        {mutation.error && (
          <p className="text-paragraph-small text-destructive" role="alert">
            {mutation.error.message}
          </p>
        )}
      </div>
    </form>
  )
}

function ProfileContainer({
  profile,
  options,
}: {
  profile: Awaited<ReturnType<typeof fetchProfile>>
  options: Options
}) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl)
  const [ibjCareerName, setIbjCareerName] = useState(() =>
    getIbjCareerName(
      profile.joinedYear ? String(profile.joinedYear) : '',
      profile.joinedMonth ? String(profile.joinedMonth) : '',
    ),
  )
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
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      setIsEditing(false)
    },
  })

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <div className="flex justify-between mb-6">
          <h2 className="text-heading-1 text-foreground">プロフィール</h2>
          {isEditing ? (
            <Button
              key="save"
              type="submit"
              form="profile-edit-form"
              isDisabled={mutation.isPending}
              leftIcon={<Image src={pen} alt="" />}
              className="w-auto px-6 py-4"
            >
              {mutation.isPending ? '保存中' : '保存'}
            </Button>
          ) : (
            <Button
              key="edit"
              type="button"
              onClick={() => setIsEditing(true)}
              leftIcon={<Image src={pen} alt="" />}
              className="w-auto px-6 py-4"
            >
              編集
            </Button>
          )}
        </div>

        {isEditing ? (
          <ProfileEditForm
            form={form}
            options={options}
            mutation={mutation}
            avatarUrl={avatarUrl}
            onAvatarUrlChange={setAvatarUrl}
            ibjCareerName={ibjCareerName}
            setIbjCareerName={setIbjCareerName}
            onSubmit={(data) => mutation.mutate(data)}
          />
        ) : (
          <ProfileView profile={profile} options={options} avatarUrl={avatarUrl} />
        )}
      </div>

      <ActivityHistory items={ACTIVITY_ITEMS} />
    </div>
  )
}
