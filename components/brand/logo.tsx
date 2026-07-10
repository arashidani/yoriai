import Image, { type ImageProps } from 'next/image'
import logoFull from '@/assets/logo-full.svg'
import logoMark from '@/assets/logo-mark.svg'

const sources = {
  /** ロゴマーク＋ワードマーク（横長）。ヘッダーやログイン画面向け。 */
  full: logoFull,
  /** ロゴマークのみ（正方形寄り）。favicon 代替・折りたたみ時の狭い領域向け。 */
  mark: logoMark,
} as const

type LogoProps = Omit<ImageProps, 'src' | 'alt'> & {
  /** 表示するロゴの種類。既定は `full`。 */
  variant?: keyof typeof sources
  /** 代替テキスト。既定は 'Yoriai'。装飾目的なら空文字を渡す。 */
  alt?: string
}

/**
 * サービスロゴ。`assets/` の SVG を `next/image` 経由で表示する。
 *
 * サイズは className で高さを指定し幅を auto にすると縦横比を保てる。
 * 例: `<Logo className="h-8 w-auto" />`
 */
export function Logo({ variant = 'full', alt = 'Yoriai', ...props }: LogoProps) {
  return <Image src={sources[variant]} alt={alt} {...props} />
}
