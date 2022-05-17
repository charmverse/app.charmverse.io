/*
  Warnings:

  - Added the required column `status` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicationId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'inProgress', 'review', 'rejected', 'complete', 'paid');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "status" "ApplicationStatus" NOT NULL,
ADD COLUMN     "submission" TEXT,
ADD COLUMN     "submissionNodes" TEXT,
ALTER COLUMN "walletAddress" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "applicationId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
