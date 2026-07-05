import { Hono } from 'hono'
import { postsRoute } from './routes/posts'
import { adminRoute } from './routes/admin'
import { usersRoute } from './routes/users'

const app = new Hono()
  .basePath('/api')
  .route('/posts', postsRoute)
  .route('/admin', adminRoute)
  .route('/users', usersRoute)

export type AppType = typeof app
export default app
