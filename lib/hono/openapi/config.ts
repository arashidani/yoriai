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
      name: 'questions',
      description: '質問（投稿）の閲覧・作成・削除、回答の投稿・一覧取得、解決済み操作',
    },
    { name: 'question-tags', description: 'Q&Aの質問タグ候補' },
    { name: 'answers', description: '回答へのいいね' },
    {
      name: 'hiroba',
      description: 'ひろば（サブフォーラム）の一覧・詳細取得、投稿の作成（実名表示）',
    },
    { name: 'hiroba-posts', description: 'ひろば投稿の取得・回答・いいね・保存・削除' },
    { name: 'hiroba-answers', description: 'ひろば回答へのいいね' },
    { name: 'users', description: 'ユーザー登録・自分のプロフィール取得' },
    { name: 'onboarding', description: '初回プロフィール登録' },
    { name: 'admin', description: '管理者専用のユーザー・投稿管理' },
    { name: 'invites', description: '招待リンクの発行・確認' },
    { name: 'notifications', description: '自分宛て通知の一覧取得・既読化・未読件数取得' },
    { name: 'password-resets', description: 'パスワードリセットリンクの確認・実行' },
  ],
}
