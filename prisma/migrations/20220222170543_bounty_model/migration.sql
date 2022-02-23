-- CreateEnum
CREATE TYPE "BountyStatus" AS ENUM ('open', 'assigned', 'review', 'complete', 'paid');

-- CreateTable
CREATE TABLE "Bounty" (
    "id" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "descriptionNodes" JSONB NOT NULL,
    "reviewer" UUID,
    "assignee" UUID,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "rewardToken" TEXT NOT NULL,
    "status" "BountyStatus" NOT NULL DEFAULT E'open',
    "title" TEXT NOT NULL,
    "linkedTaskId" UUID,

    CONSTRAINT "Bounty_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
