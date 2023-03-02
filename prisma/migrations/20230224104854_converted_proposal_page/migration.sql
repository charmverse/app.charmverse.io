/*
  Warnings:

  - A unique constraint covering the columns `[convertedProposalId]` on the table `Page` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "convertedProposalId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Page_convertedProposalId_key" ON "Page"("convertedProposalId");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_convertedProposalId_fkey" FOREIGN KEY ("convertedProposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
