'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import eyeIcon from '@/assets/eye.png'
import eyeOffIcon from '@/assets/eye-off.png'
import leftImage from '@/assets/login-left.svg'
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
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background-subtle">
      <RegisterImagePanel image={leftImage} />
      <RegisterSidePanel>
        <div className="space-y-16 w-full max-w-90">
          <div className="space-y-4 text-center max-w-90">
            <p className="text-heading-1 font-bold text-foreground">おかえりなさい</p>

            <p className="text-body font-medium text-secondary-foreground">
              さっそくログインしましょう
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-16 w-full">
            <div className="space-y-4">
              <FormField
                label="メールアドレス"
                error={errors.email?.message}
                inputProps={{
                  id: 'email',
                  type: 'email',
                  placeholder: 'sample@ibjapan.jp',
                  ...register('email'),
                }}
              />

              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-1 items-center">
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
                    {...passwordField}
                    aria-invalid={!!errors.password}
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
