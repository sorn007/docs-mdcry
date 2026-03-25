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
# Dummy URL for generate only (no live DB required).
ENV DATABASE_URL="postgresql://prisma:prisma@127.0.0.1:5432/prisma"
RUN npx prisma generate

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime deps (pg, prisma client runtime, etc.)
COPY --from=deps /app/node_modules ./node_modules

# Generated Prisma engine + client (deps stage never runs `prisma generate`)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Nuxt output
COPY --from=build /app/.output ./.output

EXPOSE 3000

# NOTE: set DATABASE_URL to your PostgreSQL connection string at runtime
CMD ["node", ".output/server/index.mjs"]

