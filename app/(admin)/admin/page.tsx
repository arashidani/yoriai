import { MOCK_POSTS, MOCK_USERS } from "@/lib/mocks/fixtures";

export default async function AdminDashboardPage() {
  // TODO: Supabase接続後はPrismaで取得
  const postCount = MOCK_POSTS.length;
  const userCount = MOCK_USERS.length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理者ダッシュボード</h1>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">投稿数</p>
          <p className="text-3xl font-bold">{postCount}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">ユーザー数</p>
          <p className="text-3xl font-bold">{userCount}</p>
        </div>
      </div>
    </div>
  );
}
