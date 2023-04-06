-- AlterTable
ALTER TABLE "ProfileItem" ADD COLUMN     "walletAddress" TEXT;

-- AlterTable
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("address");

-- CreateIndex
CREATE INDEX "ProfileItem_walletAddress_idx" ON "ProfileItem"("walletAddress");

-- AddForeignKey
ALTER TABLE "ProfileItem" ADD CONSTRAINT "ProfileItem_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "UserWallet"("address") ON DELETE CASCADE ON UPDATE CASCADE;
