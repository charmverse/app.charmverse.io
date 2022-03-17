/*
  Warnings:

  - Made the column `chainId` on table `Bounty` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('metamask', 'gnosis');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_bountyId_fkey";

-- AlterTable
ALTER TABLE "Bounty" ALTER COLUMN "chainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "gnosisSafeAddress" TEXT,
ADD COLUMN     "walletType" "WalletType" NOT NULL DEFAULT E'metamask';

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
