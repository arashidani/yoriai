import app from '@/lib/hono/app'

// /api/chat のSSEストリームが既定のタイムアウトで打ち切られないよう延長する
export const maxDuration = 60

export const GET = app.fetch
export const POST = app.fetch
export const PUT = app.fetch
export const PATCH = app.fetch
export const DELETE = app.fetch
