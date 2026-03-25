import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required')
}

const username = (process.env.SEED_ADMIN_USERNAME ?? 'admin').trim()
const passwordRaw = process.env.SEED_ADMIN_PASSWORD
if (!passwordRaw?.trim()) {
  throw new Error('SEED_ADMIN_PASSWORD is required (set in .env or environment)')
}
const password = passwordRaw.trim()

const updateExisting = process.env.SEED_UPDATE_ADMIN_PASSWORD === '1'

const pool = new pg.Pool({ connectionString: url })
const adapter = new PrismaPg(pool as never)
const prisma = new PrismaClient({ adapter })

async function main() {
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    if (updateExisting) {
      const passwordHash = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash }
      })
      console.log(`Updated password for user "${username}" (SEED_UPDATE_ADMIN_PASSWORD=1)`)
      return
    }
    console.log(`Seed skipped: user "${username}" already exists (set SEED_UPDATE_ADMIN_PASSWORD=1 to reset password)`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { username, passwordHash }
  })
  console.log(`Seeded admin user: ${username}`)
}

main()
  .catch((e: unknown) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
