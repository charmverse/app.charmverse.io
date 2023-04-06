/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `UserWallet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProfileItem" ADD COLUMN     "walletId" UUID;

-- AlterTable
ALTER TABLE "UserWallet" ADD COLUMN     "id" UUID;

-- CreateIndex
CREATE INDEX "ProfileItem_walletId_idx" ON "ProfileItem"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_id_key" ON "UserWallet"("id");

-- AddForeignKey
ALTER TABLE "ProfileItem" ADD CONSTRAINT "ProfileItem_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "UserWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
