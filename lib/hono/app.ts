import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { openApiConfig } from './openapi/config'
import { adminRoute } from './routes/admin'
import { postsRoute } from './routes/posts'
import { usersRoute } from './routes/users'

const app = new OpenAPIHono()
  .basePath('/api')
  .route('/posts', postsRoute)
  .route('/admin', adminRoute)
  .route('/users', usersRoute)

app.openAPIRegistry.registerComponent('securitySchemes', 'supabaseSession', {
  type: 'apiKey',
  in: 'cookie',
  name: 'sb-access-token',
  description:
    'Supabase Auth のセッションクッキーによる認証。' +
    '実際のクッキー名はSupabaseプロジェクトごとに異なる（例: sb-<project-ref>-auth-token）。',
})

// OpenAPI 3.1 ドキュメント (GET /api/openapi.json)
app.doc31('/openapi.json', openApiConfig)

// Swagger UI (GET /api/docs)
app.get('/docs', swaggerUI({ url: '/api/openapi.json' }))

export type AppType = typeof app
export default app
