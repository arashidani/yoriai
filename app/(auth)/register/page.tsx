'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/hono/client'
import { createClient } from '@/lib/supabase/client'

type Invite = { name: string | null; role: string }

function RegisterForm() {
  const router = useRouter()
  const token = useSearchParams().get('token')
  const [invite, setInvite] = useState<Invite | null>(null)
  const [inviteError, setInviteError] = useState(false)
  const [checking, setChecking] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      setName(invite.name ?? '')
      setChecking(false)
    })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invite || !token) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const res = await client.api.users.$post({ json: { name, inviteToken: token } })
      if (!res.ok) {
        const body = await res.json()
        setError('error' in body ? body.error : 'ユーザー情報の保存に失敗しました')
        setLoading(false)
        return
      }
    }

    router.push('/')
    router.refresh()
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-xl">
        <h1 className="text-2xl font-bold text-center">ユーザー登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">表示名</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
              minLength={8}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登録中...' : 'アカウント作成'}
          </Button>
        </form>
      </div>
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
