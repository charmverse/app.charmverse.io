/*
  Warnings:

  - A unique constraint covering the columns `[proposalId]` on the table `Page` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('private_draft', 'draft', 'discussion', 'review', 'reviewed', 'vote_active', 'vote_closed');

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "proposalId" UUID;

-- CreateTable
CREATE TABLE "Proposal" (
    "id" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "status" "ProposalStatus" NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalAuthor" (
    "proposalId" UUID NOT NULL,
    "userId" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "ProposalReviewer" (
    "proposalId" UUID NOT NULL,
    "userId" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProposalAuthor_proposalId_userId_key" ON "ProposalAuthor"("proposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalReviewer_proposalId_userId_key" ON "ProposalReviewer"("proposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_proposalId_key" ON "Page"("proposalId");

-- AddForeignKey
ALTER TABLE "ProposalAuthor" ADD CONSTRAINT "ProposalAuthor_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalAuthor" ADD CONSTRAINT "ProposalAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalReviewer" ADD CONSTRAINT "ProposalReviewer_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalReviewer" ADD CONSTRAINT "ProposalReviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
