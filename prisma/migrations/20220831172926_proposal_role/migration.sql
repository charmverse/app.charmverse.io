/*
  Warnings:

  - A unique constraint covering the columns `[userId,proposalId]` on the table `ProposalReviewer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,proposalId]` on the table `ProposalReviewer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `group` to the `ProposalReviewer` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `ProposalReviewer` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ProposalReviewerGroup" AS ENUM ('role', 'user');

-- DropIndex
DROP INDEX "ProposalReviewer_proposalId_userId_key";

-- AlterTable
ALTER TABLE "ProposalReviewer" ADD COLUMN     "group" "ProposalReviewerGroup" NOT NULL,
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "roleId" UUID,
ALTER COLUMN "userId" DROP NOT NULL,
ADD CONSTRAINT "ProposalReviewer_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalReviewer_userId_proposalId_key" ON "ProposalReviewer"("userId", "proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalReviewer_roleId_proposalId_key" ON "ProposalReviewer"("roleId", "proposalId");

-- AddForeignKey
ALTER TABLE "ProposalReviewer" ADD CONSTRAINT "ProposalReviewer_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
