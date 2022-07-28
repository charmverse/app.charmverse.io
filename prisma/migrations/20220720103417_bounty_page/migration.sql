/*
  Warnings:

  - A unique constraint covering the columns `[bountyId]` on the table `Page` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PageType" ADD VALUE 'bounty';

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "bountyId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Page_bountyId_key" ON "Page"("bountyId");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
