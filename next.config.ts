import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  // sharpはlibvips-cpp.soをdlopenで動的ロードするため、Output File Tracingの
  // 静的解析だけでは検出できずデプロイ成果物から漏れることがある。明示的に含める。
  // sharpを使うのはHonoのAPIハンドラだけなので、全ルート('/*')ではなくAPIの
  // catch-allルートに限定する。キーはpicomatchでルートパスに対して評価されるため、
  // 角括弧・ドットはエスケープが必要（Next.jsのドキュメント記載の書式）。
  outputFileTracingIncludes: {
    '/api/\\[\\[\\.\\.\\.route\\]\\]': ['node_modules/sharp/**/*', 'node_modules/@img/**/*'],
  },
}

export default nextConfig
