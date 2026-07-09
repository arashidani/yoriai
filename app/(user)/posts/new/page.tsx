'use client';

import { useRouter } from 'next/navigation';
import { PostForm } from '@/components/posts/post-form';
import { client } from '@/lib/hono/client';
import type { CreatePostInput } from '@/lib/schemas/post';

export default function NewPostPage() {
  const router = useRouter();

  async function handleSubmit(data: CreatePostInput) {
    const res = await client.api.posts.$post({ json: data });
    if (res.ok) {
      router.push('/');
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">質問を投稿する</h1>
      <PostForm onSubmit={handleSubmit} />
    </div>
  );
}
