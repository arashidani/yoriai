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
  outputFileTracingIncludes: {
    '/*': ['node_modules/sharp/**/*', 'node_modules/@img/**/*'],
  },
}

export default nextConfig
