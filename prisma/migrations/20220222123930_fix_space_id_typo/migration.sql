/*
  Warnings:

  - You are about to drop the column `spacedId` on the `Bounty` table. All the data in the column will be lost.
  - Added the required column `spaceId` to the `Bounty` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Bounty" DROP CONSTRAINT "Bounty_spacedId_fkey";

-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "spacedId",
ADD COLUMN     "spaceId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
