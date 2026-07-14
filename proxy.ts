import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { requireEnv } from '@/lib/env'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/register', '/reset-password']
  const isPublicPath = publicPaths.includes(pathname)

  // 未認証ユーザーを /login にリダイレクト（/login・/register・/reset-password・/api は除外）
  if (!user) {
    if (!isPublicPath && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  const role = (user.app_metadata?.role as string) ?? 'USER'
  const homePath = role === 'ADMIN' ? '/admin' : '/'

  // ログイン済みユーザーが /login・/register・/reset-password にアクセスしたら自分のホームへ
  if (isPublicPath) {
    return NextResponse.redirect(new URL(homePath, request.url))
  }

  // 管理者以外の /admin へのアクセスを拒否
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 管理者は /admin 以外（/api を除く）を利用不可 — 一般ユーザーとして振る舞わせない
  if (role === 'ADMIN' && !pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
