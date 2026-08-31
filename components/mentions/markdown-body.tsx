import { Children, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { MentionText } from '@/components/mentions/mention-text'
import { markdownProseClassName } from '@/lib/text/markdown-prose-class'
import { normalizeMarkdownBodySource } from '@/lib/text/normalize-markdown-body'
import { cn } from '@/lib/utils'

const ALLOWED_ELEMENTS = [
  'p',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'code',
  'pre',
  'br',
  'del',
]

type MarkdownBodyProps = {
  text: string
  className?: string
  /** カード全体がリンクのときなど、URL に追加で当てる className */
  linkClassName?: string
}

function wrapMentions(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return <MentionText text={child} parseUrls={false} />
    }
    return child
  })
}

type MarkdownChildren = { children?: ReactNode }

function toSafeHttpUrl(href: string): string {
  try {
    const url = new URL(href)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    // ignore invalid URLs
  }
  return ''
}

export function MarkdownBody({ text, className, linkClassName }: MarkdownBodyProps) {
  const source = normalizeMarkdownBodySource(text)

  return (
    <div className={cn(markdownProseClassName, className)}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        urlTransform={toSafeHttpUrl}
        components={{
          p: ({ children }: MarkdownChildren) => <p>{wrapMentions(children)}</p>,
          li: ({ children }: MarkdownChildren) => <li>{wrapMentions(children)}</li>,
          blockquote: ({ children }: MarkdownChildren) => (
            <blockquote>{wrapMentions(children)}</blockquote>
          ),
          strong: ({ children }: MarkdownChildren) => <strong>{wrapMentions(children)}</strong>,
          em: ({ children }: MarkdownChildren) => <em>{wrapMentions(children)}</em>,
          del: ({ children }: MarkdownChildren) => <del>{wrapMentions(children)}</del>,
          a: ({ href, children }: MarkdownChildren & { href?: string }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
              {wrapMentions(children)}
            </a>
          ),
        }}
      >
        {source}
      </Markdown>
    </div>
  )
}
