/*
  Warnings:

  - You are about to drop the column `bountyId` on the `Transaction` table. All the data in the column will be lost.
  - Made the column `applicationId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_bountyId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "bountyId",
ALTER COLUMN "applicationId" SET NOT NULL;
