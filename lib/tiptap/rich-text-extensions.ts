import { Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import Blockquote from '@tiptap/extension-blockquote'
import StarterKit from '@tiptap/starter-kit'
import { BulletList, OrderedList } from '@tiptap/extension-list'
import type { Extensions } from '@tiptap/core'

type RichTextExtensionsOptions = {
  placeholder?: string
  /** 箇条書き・番号付きリスト・引用の入力ルールを有効にする */
  blockInputRules?: boolean
}

function withoutInputRules<T extends { extend: (config: { addInputRules: () => [] }) => T }>(
  extension: T,
) {
  return extension.extend({
    addInputRules: () => [],
  })
}

export function createRichTextExtensions({
  placeholder,
  blockInputRules = false,
}: RichTextExtensionsOptions = {}): Extensions {
  const blockquote = blockInputRules ? Blockquote : withoutInputRules(Blockquote)
  const bulletList = blockInputRules ? BulletList : withoutInputRules(BulletList)
  const orderedList = blockInputRules ? OrderedList : withoutInputRules(OrderedList)

  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      horizontalRule: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      },
    }),
    blockquote,
    bulletList,
    orderedList,
    Markdown,
    Placeholder.configure({ placeholder: placeholder ?? '' }),
  ]
}
