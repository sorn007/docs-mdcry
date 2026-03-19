-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionHash" TEXT NOT NULL,
    "treeJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PublicLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "passwordHash" TEXT,
    "scopeType" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "lastAccessAt" DATETIME
);

-- CreateTable
CREATE TABLE "PublicLinkAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicLinkId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "PublicLinkAccessLog_publicLinkId_fkey" FOREIGN KEY ("publicLinkId") REFERENCES "PublicLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
