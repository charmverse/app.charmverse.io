/*
  Warnings:

  - A unique constraint covering the columns `[ensname]` on the table `UserWallet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserWallet" ADD COLUMN     "ensname" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_ensname_key" ON "UserWallet"("ensname");
