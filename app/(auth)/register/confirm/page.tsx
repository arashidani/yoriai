'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import confirmRightImage from '@/assets/register-confirm-right.png'
import { Button } from '@/components/design-system/button'
import { RegisterImagePanel } from '@/components/register/register-image-panel'
import { RegisterSidePanel } from '@/components/register/register-side-panel'
import { client } from '@/lib/hono/client'
import type { RegisterFormInput } from '@/lib/schemas/register'
import { createClient } from '@/lib/supabase/client'

type StoredRegisterData = RegisterFormInput & { token: string }

export default function RegisterConfirmPage() {
  const router = useRouter()
  const [data, setData] = useState<StoredRegisterData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('registerFormData')
    if (!raw) {
      setNotFound(true)
      return
    }
    setData(JSON.parse(raw) as StoredRegisterData)
  }, [])

  async function handleRegister() {
    if (!data) return
    setError(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsSubmitting(false)
      return
    }

    if (signUpData.user) {
      const res = await client.api.users.$post({
        json: { name: data.name, inviteToken: data.token },
      })
      if (!res.ok) {
        const body = await res.json()
        setError('error' in body ? body.error : 'ユーザー情報の保存に失敗しました')
        setIsSubmitting(false)
        return
      }
    }

    sessionStorage.removeItem('registerFormData')
    router.push('/register/complete')
    router.refresh()
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-8 border rounded-xl text-center">
          <h1 className="text-xl font-bold">確認内容が見つかりません</h1>
          <p className="text-sm text-muted-foreground">
            もう一度登録フォームから入力してください。
          </p>
          <a href="/register" className="underline underline-offset-4 hover:text-primary text-sm">
            登録フォームに戻る
          </a>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="relative flex h-screen items-center justify-center bg-background-subtle">
      <RegisterImagePanel image={confirmRightImage} />

      <RegisterSidePanel>
        <div className="w-full max-w-95 h-139 flex flex-col justify-between">
          <div className="flex flex-col gap-16">
            <div className="flex flex-col gap-4 items-center">
              <h1 className="text-2xl font-bold text-center">登録内容の確認</h1>

              <p className="text-secondary-foreground">以下の内容で登録してよろしいでしょうか</p>
            </div>

            <div className="flex flex-col gap-6 items-start w-95">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-foreground">メールアドレス</p>

                <p className="text-sm text-foreground">{data.email}</p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-foreground">氏名</p>

                <p className="text-sm  text-foreground">{data.name}</p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-foreground">パスワード</p>

                <p className="text-sm text-foreground">{'●'.repeat(data.password.length)}</p>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-4 w-95">
            <a
              href={`/register?token=${encodeURIComponent(data.token)}`}
              className="flex items-center justify-center text-center text-secondary-foreground font-bold border-2 border-input rounded-full bg-background px-8 py-6 hover:opacity-60"
            >
              戻る
            </a>
            <div className="flex-1">
              <Button type="button" isDisabled={isSubmitting} onClick={handleRegister}>
                {isSubmitting ? '登録中...' : '登録する'}
              </Button>
            </div>
          </div>
        </div>
      </RegisterSidePanel>
    </div>
  )
}
