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
const adapterMod = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg')
const pgMod = require('pg') as typeof import('pg')

const { PrismaClient } = prismaMod
const { PrismaPg } = adapterMod
const { Pool } = pgMod

let poolSingleton: InstanceType<typeof Pool> | undefined
let prismaSingleton: InstanceType<typeof PrismaClient> | undefined

export function prisma() {
  if (!prismaSingleton) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is required')
    if (!poolSingleton) {
      poolSingleton = new Pool({ connectionString: url })
    }
    // @types/pg vs adapter's pg typings can disagree; Pool instance is valid at runtime.
    const adapter = new PrismaPg(poolSingleton as never)
    prismaSingleton = new PrismaClient({ adapter })
  }
  return prismaSingleton
}

