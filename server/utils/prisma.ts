import { createRequire } from 'node:module'
import { join } from 'node:path'

/**
 * Nitro output is ESM; @prisma/client is CommonJS. Rollup may rewrite
 * `import pkg from '@prisma/client'` into a broken named ESM import.
 * Loading via `require()` avoids any ESM/CJS interop issues at runtime.
 *
 * Use a path under `process.cwd()` (not `import.meta.url`): bundled Nitro can
 * expose a bogus URL (e.g. `/_entry.js`), which breaks module resolution.
 * Anchor to an existing file inside `node_modules` so `require` finds `/app/node_modules`.
 */
const require = createRequire(join(process.cwd(), 'node_modules/@prisma/client/package.json'))
const prismaMod = require('@prisma/client') as typeof import('@prisma/client')
const adapterMod = require('@prisma/adapter-better-sqlite3') as typeof import('@prisma/adapter-better-sqlite3')

const { PrismaClient } = prismaMod
const { PrismaBetterSqlite3 } = adapterMod

let prismaSingleton: InstanceType<typeof PrismaClient> | undefined

export function prisma() {
  if (!prismaSingleton) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is required')
    const adapter = new PrismaBetterSqlite3({ url })
    prismaSingleton = new PrismaClient({ adapter })
  }
  return prismaSingleton
}

