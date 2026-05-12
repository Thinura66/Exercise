import { execSync } from 'child_process'
import { config as loadDotenv } from 'dotenv'

export async function setup() {
  loadDotenv({ path: '.env.test' })
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!
  execSync('npx prisma db push --skip-generate --force-reset', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL! },
    stdio: 'inherit',
  })
}
