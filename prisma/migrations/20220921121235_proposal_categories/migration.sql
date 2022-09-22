-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "categoryId" UUID;

-- CreateTable
CREATE TABLE "ProposalCategory" (
    "id" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "ProposalCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProposalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
