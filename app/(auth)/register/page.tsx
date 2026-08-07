'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import eyeIcon from '@/assets/eye.png'
import eyeOffIcon from '@/assets/eye-off.png'
import passwordInsufficientIcon from '@/assets/password-insufficient.png'
import passwordOkIcon from '@/assets/password-ok.png'
import { Button } from '@/components/design-system/button'
import { FormField } from '@/components/design-system/form-field'
import { RegisterImagePanel } from '@/components/register/register-image-panel'
import { RegisterSidePanel } from '@/components/register/register-side-panel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/hono/client'
import { type RegisterFormInput, registerFormSchema } from '@/lib/schemas/register'
import { cn } from '@/lib/utils'

type Invite = { name: string | null; role: string }

function RegisterForm() {
  const router = useRouter()
  const token = useSearchParams().get('token')
  const [invite, setInvite] = useState<Invite | null>(null)
  const [inviteError, setInviteError] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onChange',
  })
  const emailField = register('email')
  const passwordField = register('password')
  const password = watch('password')
  const isPasswordValid =
    /^[a-zA-Z0-9]+$/.test(password ?? '') &&
    /[a-zA-Z]/.test(password ?? '') &&
    /[0-9]/.test(password ?? '')
  const isOverEightWords = (password ?? '').length >= 8

  useEffect(() => {
    if (!token) {
      setInviteError(true)
      setChecking(false)
      return
    }
    client.api.invites[':token'].$get({ param: { token } }).then(async (res) => {
      if (!res.ok) {
        setInviteError(true)
        setChecking(false)
        return
      }
      const { invite } = await res.json()
      setInvite(invite)

      const raw = sessionStorage.getItem('registerFormData')
      const stored = raw ? (JSON.parse(raw) as RegisterFormInput & { token: string }) : null
      if (stored && stored.token === token) {
        reset({ name: stored.name, email: stored.email, password: stored.password })
      } else {
        reset()
      }
      setChecking(false)
    })
  }, [token, reset])

  async function onSubmit(data: RegisterFormInput) {
    if (!invite || !token) return
    setError(null)

    sessionStorage.setItem('registerFormData', JSON.stringify({ ...data, token }))
    router.push('/register/confirm')
  }

  if (checking) return null

  if (inviteError || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-8 border rounded-xl text-center">
          <h1 className="text-xl font-bold">この招待リンクは無効です</h1>
          <p className="text-sm text-muted-foreground">
            リンクの期限が切れているか、すでに使用されています。管理者に新しい招待リンクの発行を依頼してください。
          </p>
          <a href="/login" className="underline underline-offset-4 hover:text-primary text-sm">
            ログインはこちら
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen items-center bg-background-subtle overflow-hidden">
      <RegisterImagePanel />

      <RegisterSidePanel>
        <div className="w-full max-w-95 h-139 flex flex-col justify-between">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col justify-between h-full w-full"
          >
            <div className="flex flex-col gap-16">
              <div className="flex flex-col gap-4 items-center">
                <h1 className="text-2xl font-bold text-foreground">ようこそ</h1>

                <p className="text-secondary-foreground">
                  情報を入力してアカウント登録をしましょう
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <FormField
                  label="メールアドレス"
                  error={
                    emailTouched && errors.email
                      ? '有効なメールアドレスを入力してください'
                      : undefined
                  }
                  inputProps={{
                    id: 'email',
                    type: 'email',
                    placeholder: 'example@ibjapan.jp',
                    ...emailField,
                    onBlur: (e) => {
                      emailField.onBlur(e)
                      setEmailTouched(true)
                    },
                  }}
                />

                <FormField
                  label="表示名"
                  error={errors.name?.message}
                  inputProps={{
                    id: 'name',
                    type: 'text',
                    placeholder: '山田太郎',
                    ...register('name'),
                  }}
                />

                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">
                    <p className="text-sm font-bold text-foreground">パスワード</p>
                  </Label>

                  <div className="relative">
                    <Input
                      id="password"
                      type={passwordVisible ? 'text' : 'password'}
                      {...passwordField}
                      className={cn('p-3 h-11 pr-16')}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={passwordVisible ? 'パスワードを隠す' : 'パスワードを表示'}
                    >
                      <Image
                        src={passwordVisible ? eyeIcon : eyeOffIcon}
                        alt=""
                        width={16}
                        height={16}
                      />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <Image
                        src={isPasswordValid ? passwordOkIcon : passwordInsufficientIcon}
                        alt=""
                        width={20}
                        height={20}
                        className="shrink-0"
                      />
                      <span
                        className={isPasswordValid ? 'text-green-400' : 'text-secondary-foreground'}
                      >
                        半角英数字両方を含む
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Image
                        src={isOverEightWords ? passwordOkIcon : passwordInsufficientIcon}
                        alt=""
                        width={20}
                        height={20}
                        className="shrink-0"
                      />
                      <span
                        className={
                          isOverEightWords ? 'text-green-400' : 'text-secondary-foreground'
                        }
                      >
                        8文字以上
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {error && <p className="">{error}</p>}
              <Button type="submit" isDisabled={!isValid || isSubmitting}>
                {isSubmitting ? '登録中...' : '確認へ進む'}
              </Button>
            </div>
          </form>
        </div>
      </RegisterSidePanel>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
