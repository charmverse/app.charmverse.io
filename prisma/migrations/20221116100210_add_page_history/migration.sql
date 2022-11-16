-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SpaceRole" ADD COLUMN     "tokenGateId" UUID;

-- CreateTable
CREATE TABLE "PageDiff" (
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "version" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "PageDiff_pageId_idx" ON "PageDiff"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageDiff_pageId_version_key" ON "PageDiff"("pageId", "version");

-- AddForeignKey
ALTER TABLE "PageDiff" ADD CONSTRAINT "PageDiff_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceRole" ADD CONSTRAINT "SpaceRole_tokenGateId_fkey" FOREIGN KEY ("tokenGateId") REFERENCES "TokenGate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
