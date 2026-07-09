import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Author = {
  id: string;
  name: string | null;
  email: string;
};

type Post = {
  id: string;
  title: string;
  body: string;
  author: Author | null;
  createdAt: Date | string;
};

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  const createdAt = new Date(post.createdAt).toLocaleDateString("ja-JP");
  const excerpt = post.body.length > 100 ? `${post.body.slice(0, 100)}…` : post.body;

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm line-clamp-3">{excerpt}</p>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground flex justify-between">
          <span>{post.author ? (post.author.name ?? post.author.email) : "退会したユーザー"}</span>
          <span>{createdAt}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
