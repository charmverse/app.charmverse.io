/*
  Warnings:

  - You are about to drop the column `reviewer` on the `Bounty` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "reviewer";

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "publicBountyBoard" BOOLEAN DEFAULT false;
