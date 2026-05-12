import { execSync } from 'child_process'
import { config as loadDotenv } from 'dotenv'

export async function setup() {
  loadDotenv({ path: '.env.test' })
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL is not set. Create .env.test with TEST_DATABASE_URL=postgresql://...')
  }
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  execSync('npx prisma db push --skip-generate --force-reset', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    stdio: 'inherit',
  })
}
