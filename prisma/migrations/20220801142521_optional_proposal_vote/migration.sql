-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_voteId_fkey";

-- AlterTable
ALTER TABLE "Proposal" ALTER COLUMN "voteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
