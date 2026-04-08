-- AlterTable
ALTER TABLE "PublicLink" ADD COLUMN     "allowMarkdownDownload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowExportWord" BOOLEAN NOT NULL DEFAULT false;
