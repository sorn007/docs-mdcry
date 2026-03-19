# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime deps (includes better-sqlite3, prisma client runtime, etc.)
COPY --from=deps /app/node_modules ./node_modules

# Nuxt output
COPY --from=build /app/.output ./.output

EXPOSE 3000

# NOTE: expects DATABASE_URL in env, e.g. file:/data/dev.db
CMD ["node", ".output/server/index.mjs"]

