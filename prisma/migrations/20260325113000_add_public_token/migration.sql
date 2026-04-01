ALTER TABLE "PublicLink" ADD COLUMN "token" TEXT;
CREATE UNIQUE INDEX "PublicLink_token_key" ON "PublicLink"("token");

