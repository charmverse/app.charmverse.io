-- CreateEnum
CREATE TYPE "BountyStatus" AS ENUM ('open', 'assigned', 'review', 'complete', 'paid');

-- CreateTable
CREATE TABLE "InviteLink" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "maxAgeMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxUses" INTEGER NOT NULL DEFAULT -1,
    "useCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InviteLink_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "InviteLink_code_key" ON "InviteLink"("code");

-- AddForeignKey
ALTER TABLE "InviteLink" ADD CONSTRAINT "InviteLink_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteLink" ADD CONSTRAINT "InviteLink_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
