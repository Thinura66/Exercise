import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

export function createTestPrisma(): { db: PrismaClient; pool: Pool } {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const db = new PrismaClient({ adapter })
  return { db, pool }
}

export async function closeTestPrisma(db: PrismaClient, pool: Pool): Promise<void> {
  await db.$disconnect()
  await pool.end()
}

export async function createUser(
  db: PrismaClient,
  overrides: Partial<{
    email: string
    name: string
    canTeach: string[]
    wantToLearn: string[]
  }> = {},
) {
  return db.user.create({
    data: {
      email: overrides.email ?? `user-${Date.now()}-${Math.random()}@test.com`,
      name: overrides.name ?? 'Test User',
      passwordHash: await bcrypt.hash('password', 1),
      canTeach: overrides.canTeach ?? ['TypeScript'],
      wantToLearn: overrides.wantToLearn ?? ['Go'],
    },
  })
}

export async function createProposal(
  db: PrismaClient,
  proposerId: string,
  counterpartId: string,
  overrides: Partial<{
    offeredSkill: string
    requestedSkill: string
  }> = {},
) {
  return db.proposal.create({
    data: {
      proposerId,
      counterpartId,
      offeredSkill: overrides.offeredSkill ?? 'TypeScript',
      requestedSkill: overrides.requestedSkill ?? 'Go',
    },
  })
}
