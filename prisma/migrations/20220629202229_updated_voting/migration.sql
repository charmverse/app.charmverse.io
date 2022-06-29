/*
  Warnings:

  - You are about to drop the column `initiatorId` on the `Vote` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `Vote` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Vote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spaceId` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_initiatorId_fkey";

-- DropIndex
DROP INDEX "Vote_initiatorId_key";

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "initiatorId",
DROP COLUMN "options",
ADD COLUMN     "createdBy" UUID NOT NULL,
ADD COLUMN     "spaceId" UUID NOT NULL,
ALTER COLUMN "description" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "VoteOptions" (
    "name" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "voteId" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VoteOptions_voteId_key" ON "VoteOptions"("voteId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteOptions_voteId_name_key" ON "VoteOptions"("voteId", "name");

-- AddForeignKey
ALTER TABLE "VoteOptions" ADD CONSTRAINT "VoteOptions_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
