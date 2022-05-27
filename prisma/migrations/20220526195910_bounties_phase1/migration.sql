-- AlterEnum
ALTER TYPE "BountyStatus" ADD VALUE 'inProgress';

-- AlterTable
ALTER TABLE "Bounty" ADD COLUMN     "approveSubmitters" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxSubmissions" INTEGER DEFAULT 1;
