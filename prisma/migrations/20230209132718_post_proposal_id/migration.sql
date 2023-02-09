/*
 Warnings:
 
 - A unique constraint covering the columns `[spaceId,path]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
 
 */
-- AlterTable
ALTER TABLE
  "Post"
ADD
  COLUMN "proposalId" UUID;

-- AddForeignKey
ALTER TABLE
  "Post"
ADD
  CONSTRAINT "Post_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;