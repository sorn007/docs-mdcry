# syntax=docker/dockerfile:1

FROM node:lts-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
# Prisma CLI is a devDependency; generate client into node_modules before Nitro bundles.
# Dummy URL for generate only (no live DB required).
ENV DATABASE_URL="postgresql://prisma:prisma@127.0.0.1:5432/prisma"
RUN npx prisma generate

RUN npm run build
RUN npm prune --omit=dev

FROM node:lts-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime deps + generated Prisma client from same stage (avoid version mismatch)
COPY --from=build /app/node_modules ./node_modules

# Nuxt output
COPY --from=build /app/.output ./.output

EXPOSE 3000

# NOTE: set DATABASE_URL to your PostgreSQL connection string at runtime
CMD ["node", ".output/server/index.mjs"]

