# docs-mdcry

`docs-mdcry` is a private Markdown documentation viewer/editor built with Nuxt 4, Prisma, PostgreSQL, and S3-compatible object storage.
It supports authenticated access, document tree browsing, rendered Markdown reading, and public link sharing with controls.

## Tech Stack

- Nuxt 4 + Vue 3 + Nuxt UI
- Prisma ORM + PostgreSQL
- S3-compatible object storage (AWS S3, R2, MinIO, etc.)
- TypeScript + ESLint

## Features

- Secure login with optional Cloudflare Turnstile protection
- Document tree and Markdown rendering
- Public links for documents with revoke/reissue controls
- Optional export/download policies for public content
- Configurable rate limiting and proxy-aware IP handling

## Prerequisites

- Node.js 20+
- npm 11+
- PostgreSQL 14+
- S3-compatible bucket and credentials

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update required values in `.env`:

- `DATABASE_URL`
- `NUXT_S3_ENDPOINT`
- `NUXT_S3_REGION`
- `NUXT_S3_ACCESS_KEY_ID`
- `NUXT_S3_SECRET_ACCESS_KEY`
- `NUXT_S3_BUCKET`

4. Run database migration:

```bash
npm run db:migrate
```

5. (Optional) Seed admin account:

```bash
npm run db:seed
```

6. Start development server:

```bash
npm run dev
```

App runs on `http://localhost:3000`.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run db:migrate` - Apply Prisma migrations
- `npm run db:seed` - Seed admin user

## Docker Compose Deployment

1. Prepare `.env` from `.env.example`.
2. Create `.env.deploy` (or export variables) with image settings:

```bash
GHCR_IMAGE=ghcr.io/<owner>/<repo>
GHCR_TAG=latest
```

3. Start services:

```bash
docker compose --env-file .env.deploy up -d
```

## Security Notes for Public Repositories

- Never commit `.env` or any real credentials.
- Keep `.env.example` sanitized with placeholder values only.
- Rotate credentials before/after making a repository public if secrets were ever exposed.
- Review public link policies before enabling external sharing.

## License

This project is licensed under the MIT License. See `LICENSE`.
