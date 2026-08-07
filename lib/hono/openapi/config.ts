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
    {
      name: 'posts',
      description: '質問（投稿）の閲覧・作成・削除、回答の投稿・一覧取得、解決済み操作',
    },
    { name: 'answers', description: '回答へのいいね' },
    { name: 'users', description: 'ユーザー登録・自分のプロフィール取得' },
    { name: 'admin', description: '管理者専用のユーザー・投稿管理' },
    { name: 'invites', description: '招待リンクの発行・確認' },
    { name: 'password-resets', description: 'パスワードリセットリンクの確認・実行' },
  ],
}
