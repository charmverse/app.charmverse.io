-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'inProgress', 'review', 'rejected', 'complete', 'paid');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "spaceId" TEXT,
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT E'applied',
ADD COLUMN     "submission" TEXT,
ADD COLUMN     "submissionNodes" TEXT,
ALTER COLUMN "walletAddress" DROP NOT NULL,
ALTER COLUMN "message" DROP NOT NULL;
