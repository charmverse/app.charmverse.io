-- AlterTable
ALTER TABLE "ProfileItem" ADD COLUMN     "walletId" UUID;

-- AlterTable
ALTER TABLE "UserWallet" ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "ProfileItem_walletId_idx" ON "ProfileItem"("walletId");

-- AddForeignKey
ALTER TABLE "ProfileItem" ADD CONSTRAINT "ProfileItem_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "UserWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
