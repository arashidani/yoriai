import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // tsconfig.json の paths ("@/*") をViteの標準機能で解決する
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
