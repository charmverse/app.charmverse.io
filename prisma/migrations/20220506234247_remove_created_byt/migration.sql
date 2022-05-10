/*
  Warnings:

  - You are about to drop the column `createdAt` on the `UserMultiSigWallet` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `UserMultiSigWallet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserMultiSigWallet" DROP COLUMN "createdAt",
DROP COLUMN "createdBy";
