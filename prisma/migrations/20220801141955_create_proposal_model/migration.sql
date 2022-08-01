-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('draft', 'in_progress', 'cancelled', 'complete');

-- CreateTable
CREATE TABLE "Proposal" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "spaceId" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL,
    "pageId" UUID NOT NULL,
    "voteId" UUID NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_pageId_key" ON "Proposal"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_voteId_key" ON "Proposal"("voteId");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
