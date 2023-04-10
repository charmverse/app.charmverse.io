-- CreateEnum
CREATE TYPE "ApiPageKeysType" AS ENUM ('typeform');

-- CreateTable
CREATE TABLE "ApiPageKeys" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "apiKey" TEXT NOT NULL,
    "type" "ApiPageKeysType" NOT NULL
);

-- CreateIndex
CREATE INDEX "ApiPageKeys_pageId_idx" ON "ApiPageKeys"("pageId");

-- CreateIndex
CREATE INDEX "ApiPageKeys_apiKey_idx" ON "ApiPageKeys"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "ApiPageKeys_pageId_type_key" ON "ApiPageKeys"("pageId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ApiPageKeys_apiKey_key" ON "ApiPageKeys"("apiKey");

-- AddForeignKey
ALTER TABLE "ApiPageKeys" ADD CONSTRAINT "ApiPageKeys_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiPageKeys" ADD CONSTRAINT "ApiPageKeys_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
