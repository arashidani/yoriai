import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// app/globals.css の独自タイポグラフィトークン(text-heading-*, text-paragraph-*, text-caption, text-monospaced)は
// tailwind-merge の既定クラスグループに存在しないため、text-{color} と衝突して片方が消えてしまう。
// font-size 専用グループとして登録し、色ユーティリティと独立してマージされるようにする。
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'heading-1',
            'heading-2',
            'heading-3',
            'heading-4',
            'paragraph-large',
            'paragraph',
            'paragraph-small',
            'paragraph-mini',
            'caption',
            'monospaced',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
