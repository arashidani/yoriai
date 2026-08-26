import Link from 'next/link'
import { AuthorAvatar } from '@/components/design-system/ui/author-avatar'

type Question = {
  id: string
  title: string
  displayAuthor: { displayName: string; avatarUrl?: string | null }
}

type AnswerableQuestionsProps = {
  posts: Question[]
}

/** 右サイドバー「あなたが回答できそうな質問」。 */
export function AnswerableQuestions({ posts }: AnswerableQuestionsProps) {
  const items = posts.slice(0, 3)

  return (
    <aside className="hidden w-72 shrink-0 border-l border-input bg-background xl:sticky xl:top-0 xl:block xl:h-svh xl:self-start">
      <div className="p-5">
        <h2 className="border-b border-input pb-3 font-heading text-paragraph-small font-bold">
          あなたが回答できそうな質問
        </h2>
        {items.length === 0 ? (
          <p className="pt-3 text-paragraph-small text-secondary-foreground">
            まだ質問がありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-1 pt-2">
            {items.map((question) => (
              <li key={question.id}>
                <Link
                  href={`/posts/${question.id}`}
                  className="-mx-2 flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                >
                  <AuthorAvatar
                    src={question.displayAuthor.avatarUrl ?? undefined}
                    alt={question.displayAuthor.displayName}
                    className="mt-0.5 size-8 rounded-full"
                  />
                  <span className="line-clamp-2 text-paragraph-small font-medium">
                    {question.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
