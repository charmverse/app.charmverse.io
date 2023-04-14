-- CreateEnum
CREATE TYPE "ApiPageKeyType" AS ENUM ('typeform');

-- CreateTable
CREATE TABLE "ApiPageKey" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "apiKey" TEXT NOT NULL,
    "type" "ApiPageKeyType" NOT NULL
);

-- CreateIndex
CREATE INDEX "ApiPageKey_pageId_idx" ON "ApiPageKey"("pageId");

-- CreateIndex
CREATE INDEX "ApiPageKey_apiKey_idx" ON "ApiPageKey"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "ApiPageKey_pageId_type_key" ON "ApiPageKey"("pageId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ApiPageKey_apiKey_key" ON "ApiPageKey"("apiKey");

-- AddForeignKey
ALTER TABLE "ApiPageKey" ADD CONSTRAINT "ApiPageKey_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiPageKey" ADD CONSTRAINT "ApiPageKey_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
