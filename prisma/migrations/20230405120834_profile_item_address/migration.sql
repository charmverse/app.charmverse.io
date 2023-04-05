-- AlterTable
ALTER TABLE "ProfileItem" ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("address");

-- AddForeignKey
ALTER TABLE "ProfileItem" ADD CONSTRAINT "ProfileItem_address_fkey" FOREIGN KEY ("address") REFERENCES "UserWallet"("address") ON DELETE CASCADE ON UPDATE CASCADE;
