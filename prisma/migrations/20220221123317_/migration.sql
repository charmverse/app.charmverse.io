-- CreateEnum
CREATE TYPE "BountyStatus" AS ENUM ('open', 'assigned', 'review', 'complete', 'paid');

-- CreateTable
CREATE TABLE "Bounty" (
    "id" UUID NOT NULL,
    "author" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "descriptionNodes" JSONB NOT NULL,
    "reviewer" UUID NOT NULL,
    "assignee" UUID NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "rewardToken" TEXT NOT NULL,
    "status" "BountyStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "linkedTaskId" UUID NOT NULL,

    CONSTRAINT "Bounty_pkey" PRIMARY KEY ("id")
);
