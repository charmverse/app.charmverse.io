-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "snapshotProposalId" TEXT;

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "defaultVotingDuration" INTEGER,
ADD COLUMN     "snapshotDomain" TEXT;
