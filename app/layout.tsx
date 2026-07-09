import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// TODO: globals.css の --font-sans は "Noto Sans JP" を指定しているが、
// このフォントは next/font で読み込んでいないため実際には反映されない。
// 反映するには next/font/google の Noto_Sans_JP（または Webフォント読み込み）を追加する。

export const metadata: Metadata = {
  title: '社内Q&Aツール',
  description: '社内向け質問共有プラットフォーム',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
