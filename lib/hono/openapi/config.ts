/** app.doc31 と生成スクリプトで共有する OpenAPI ドキュメントのメタ情報 */
export const openApiConfig = {
  openapi: '3.1.0',
  info: {
    title: 'yoriai API',
    version: '0.1.0',
    description:
      'yoriai バックエンド（Hono + Prisma + Supabase Auth）のAPI仕様書。' +
      '認証は Supabase のセッションクッキーで行う。',
  },
  // paths には basePath の /api が既に含まれるため、servers はルートにする
  servers: [{ url: '/', description: 'デフォルト' }],
  tags: [
    { name: 'posts', description: '投稿の閲覧・作成・削除' },
    { name: 'questions', description: '質問一覧・質問投稿・質問詳細' },
    { name: 'reports', description: '質問・回答の通報' },
    { name: 'users', description: 'ユーザー登録・自分のプロフィール取得' },
    { name: 'admin', description: '管理者専用のユーザー・投稿管理' },
  ],
}
