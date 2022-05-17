/*
  Warnings:

  - You are about to drop the column `approveApplicants` on the `Bounty` table. All the data in the column will be lost.
  - You are about to drop the column `submissionsCap` on the `Bounty` table. All the data in the column will be lost.
  - Added the required column `approveSubmitters` to the `Bounty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capSubmissions` to the `Bounty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "approveApplicants",
DROP COLUMN "submissionsCap",
ADD COLUMN     "approveSubmitters" BOOLEAN NOT NULL,
ADD COLUMN     "capSubmissions" BOOLEAN NOT NULL,
ADD COLUMN     "maxSubmissions" INTEGER;
