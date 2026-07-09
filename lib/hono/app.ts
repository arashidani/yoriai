import { Hono } from 'hono'
import { postsRoute } from './routes/posts'
import { adminRoute } from './routes/admin'
import { usersRoute } from './routes/users'
import { openapiRoute } from './routes/openapi'

const app = new Hono()
  .basePath('/api')
  .route('/posts', postsRoute)
  .route('/admin', adminRoute)
  .route('/users', usersRoute)
  .route('/', openapiRoute)

export type AppType = typeof app
export default app
