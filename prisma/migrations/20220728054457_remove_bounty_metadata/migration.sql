/*
  Warnings:

  - You are about to drop the column `description` on the `Bounty` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionNodes` on the `Bounty` table. All the data in the column will be lost.
  - You are about to drop the column `linkedTaskId` on the `Bounty` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Bounty` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "description",
DROP COLUMN "descriptionNodes",
DROP COLUMN "linkedTaskId",
DROP COLUMN "title";
