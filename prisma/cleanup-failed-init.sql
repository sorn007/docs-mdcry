-- Run ONLY if migration `20260324120000_init` failed partway and you need a clean slate
-- before: npx prisma migrate resolve --rolled-back 20260324120000_init
-- Then: npx prisma migrate deploy
--
-- Safe to run on empty DB (IF EXISTS). Adjust schema if not "public".

DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "PublicLinkAccessLog" CASCADE;
DROP TABLE IF EXISTS "PublicLink" CASCADE;
DROP TABLE IF EXISTS "DocIndex" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "PublicScopeType" CASCADE;
