/*
  Warnings:

  - You are about to drop the column `tokenGateConnectedDate` on the `SpaceRole` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SpaceRole" DROP COLUMN "tokenGateConnectedDate";

-- CreateTable
CREATE TABLE "PageDiff" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "PageDiff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageDiff_pageId_idx" ON "PageDiff"("pageId");

-- AddForeignKey
ALTER TABLE "PageDiff" ADD CONSTRAINT "PageDiff_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
