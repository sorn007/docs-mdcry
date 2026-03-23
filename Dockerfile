# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Prisma CLI is a devDependency; generate client into node_modules before Nitro bundles.
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma generate

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime deps (includes better-sqlite3, prisma client runtime, etc.)
COPY --from=deps /app/node_modules ./node_modules

# Generated Prisma engine + client (deps stage never runs `prisma generate`)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Nuxt output
COPY --from=build /app/.output ./.output

EXPOSE 3000

# NOTE: expects DATABASE_URL in env, e.g. file:/data/dev.db
CMD ["node", ".output/server/index.mjs"]

