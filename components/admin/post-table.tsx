import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Post = {
  id: string
  title: string
  createdAt: Date | string
  author: {
    name: string | null
    email: string
  } | null
}

type PostTableProps = {
  posts: Post[]
}

export function PostTable({ posts }: PostTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>投稿一覧</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>投稿者</TableHead>
              <TableHead>投稿日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="max-w-xs truncate">{post.title}</TableCell>
                <TableCell>{post.author ? post.author.name ?? post.author.email : '退会したユーザー'}</TableCell>
                <TableCell>
                  {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
