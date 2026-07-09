import { PostTable } from '@/components/admin/post-table';
import { MOCK_POSTS } from '@/lib/mocks/fixtures';
import { prisma } from '@/lib/prisma/client';

async function getPosts() {
  if (process.env.MOCK_MODE === 'true') return MOCK_POSTS;
  return prisma.post.findMany({
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">投稿管理</h1>
      <PostTable posts={posts} />
    </div>
  );
}
