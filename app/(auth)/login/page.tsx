'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import eyeIcon from '@/assets/eye.png'
import eyeOffIcon from '@/assets/eye-off.png'
import leftImage from '@/assets/login-left.svg'
import logoFull from '@/assets/logo-full.svg'
import { Button } from '@/components/design-system/button'
import { FormField } from '@/components/design-system/form-field'
import { FormLabel } from '@/components/design-system/form-label'
import { RegisterImagePanel } from '@/components/register/register-image-panel'
import { RegisterSidePanel } from '@/components/register/register-side-panel'
import { Input } from '@/components/ui/input'
import { type LoginFormInput, loginFormSchema } from '@/lib/schemas/login'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
  })
  const passwordField = register('password')
  const email = watch('email')
  const password = watch('password')
  const isEmpty = !email || !password

  async function onSubmit(data: LoginFormInput) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background lg:h-dvh lg:flex-row lg:items-center lg:justify-center lg:overflow-hidden lg:bg-background-subtle">
      {/* スマートフォンではイラストパネルを出さず、ロゴのみのヘッダーに切り替える */}
      <header className="flex justify-center px-5 pt-10 pb-8 lg:hidden">
        <Image src={logoFull} alt="ロゴ" width={120} height={33} priority />
      </header>

      <RegisterImagePanel image={leftImage} className="hidden lg:block" />

      <RegisterSidePanel className="m-0 h-auto w-full flex-1 rounded-none px-5 pb-10 lg:mt-6 lg:mr-6 lg:mb-6 lg:h-[calc(100dvh-3rem)] lg:w-1/2 lg:rounded-2xl lg:px-0 lg:pb-0">
        <div className="w-full max-w-90 space-y-10 lg:space-y-16">
          <div className="max-w-90 space-y-3 text-center lg:space-y-4">
            <p className="text-heading-1 font-bold text-foreground">おかえりなさい</p>

            <p className="text-body font-medium text-secondary-foreground">
              さっそくログインしましょう
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="w-full space-y-10 lg:space-y-16"
          >
            <div className="space-y-4">
              <FormField
                label="メールアドレス"
                error={errors.email?.message}
                inputProps={{
                  id: 'email',
                  type: 'email',
                  placeholder: 'sample@ibjapan.jp',
                  inputMode: 'email',
                  autoComplete: 'email',
                  autoCapitalize: 'none',
                  autoCorrect: 'off',
                  spellCheck: false,
                  enterKeyHint: 'next',
                  ...register('email'),
                }}
              />

              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center gap-1">
                  <FormLabel label="パスワード" id="password" />
                  {errors.password && (
                    <p className="text-destructive-text text-caption tracking-normal font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    {...passwordField}
                    aria-invalid={!!errors.password}
                    className={cn('p-3 h-11 pr-14')}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    // タップ領域を 44px 確保する
                    className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center"
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
              </div>

              {error && (
                <p className="text-destructive-text text-caption tracking-normal font-medium">
                  メールアドレスまたはパスワードが間違っています
                </p>
              )}
            </div>

            <Button type="submit" size="extraLarge" isDisabled={loading || isEmpty}>
              {loading ? 'ログイン中' : 'ログイン'}
            </Button>
          </form>
        </div>
      </RegisterSidePanel>
    </div>
  )
}
