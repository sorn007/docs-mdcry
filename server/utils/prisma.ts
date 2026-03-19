import { PrismaClient } from '../../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

let prismaSingleton: PrismaClient | undefined

export function prisma() {
  if (!prismaSingleton) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is required')
    const adapter = new PrismaBetterSqlite3({ url })
    prismaSingleton = new PrismaClient({ adapter })
  }
  return prismaSingleton
}

