import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load .env.local (Next.js convention) then fall back to .env
config({ path: '.env.local' })
config({ path: '.env' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use DIRECT_URL for CLI operations (migrate, db push)
    // The pooler URL (DATABASE_URL) is used at runtime via lib/prisma.ts
    url: process.env.DIRECT_URL!,
  },
})
