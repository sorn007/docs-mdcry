-- Note: no CREATE SCHEMA "public" — it requires CREATE ON DATABASE; public exists by default.
-- CreateEnum
CREATE TYPE "PublicScopeType" AS ENUM ('file', 'folder');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocIndex" (
    "id" TEXT NOT NULL,
    "versionHash" TEXT NOT NULL,
    "treeJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicLink" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "passwordHash" TEXT,
    "scopeType" "PublicScopeType" NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),

    CONSTRAINT "PublicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicLinkAccessLog" (
    "id" TEXT NOT NULL,
    "publicLinkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PublicLinkAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicLink_tokenHash_key" ON "PublicLink"("tokenHash");

-- CreateIndex
CREATE INDEX "PublicLink_scopeType_scopeKey_idx" ON "PublicLink"("scopeType", "scopeKey");

-- CreateIndex
CREATE INDEX "PublicLink_expiresAt_idx" ON "PublicLink"("expiresAt");

-- CreateIndex
CREATE INDEX "PublicLink_revokedAt_idx" ON "PublicLink"("revokedAt");

-- CreateIndex
CREATE INDEX "PublicLinkAccessLog_publicLinkId_idx" ON "PublicLinkAccessLog"("publicLinkId");

-- CreateIndex
CREATE INDEX "PublicLinkAccessLog_createdAt_idx" ON "PublicLinkAccessLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicLinkAccessLog" ADD CONSTRAINT "PublicLinkAccessLog_publicLinkId_fkey" FOREIGN KEY ("publicLinkId") REFERENCES "PublicLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
