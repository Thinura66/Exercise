import { defineConfig } from 'vitest/config'
import { config as loadDotenv } from 'dotenv'

loadDotenv({ path: '.env.test' })

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/setup.ts'],
    testTimeout: 15000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
    },
  },
})
