'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/hono/client'
import { type ResetPasswordFormInput, resetPasswordFormSchema } from '@/lib/schemas/password-reset'

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get('token')
  const [checking, setChecking] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
  })

  useEffect(() => {
    if (!token) {
      setChecking(false)
      return
    }
    client.api['password-resets'][':token'].$get({ param: { token } }).then((res) => {
      setTokenValid(res.ok)
      setChecking(false)
    })
  }, [token])

  async function onSubmit(data: ResetPasswordFormInput) {
    if (!token) return
    setError(null)

    const res = await client.api['password-resets'][':token'].$post({
      param: { token },
      json: { password: data.password },
    })

    if (!res.ok) {
      const body = await res.json()
      setError('error' in body ? body.error : '更新に失敗しました')
      return
    }

    router.push('/login')
  }

  if (checking) return null

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-8 border rounded-xl text-center">
          <h1 className="text-xl font-bold">このリンクは無効です</h1>
          <p className="text-sm text-muted-foreground">
            リンクの期限が切れているか、すでに使用されています。管理者に新しいリセットリンクの発行を依頼してください。
          </p>
          <a href="/login" className="underline underline-offset-4 hover:text-primary text-sm">
            ログインはこちら
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-xl">
        <h1 className="text-2xl font-bold text-center">パスワードの再設定</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">新しいパスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="8文字以上"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '更新中...' : 'パスワードを更新'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
