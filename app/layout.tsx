import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Noto_Sans_JP } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// デザインシステム: serif = Geist
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

// デザインシステム: monospace = Geist Mono
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// デザインシステム: sans = Inter
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

// デザインシステム: headings / body = Noto Sans JP
const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Yoriai',
  description: '社内向け質問共有プラットフォーム',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
