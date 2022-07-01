/*
  Warnings:

  - Made the column `spaceId` on table `Page` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "VoteStatus" AS ENUM ('InProgress', 'Passed', 'Rejected', 'Cancelled');

-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "spaceId" SET NOT NULL;

-- CreateTable
CREATE TABLE "UserVote" (
    "voteId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "choice" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "VoteOptions" (
    "name" TEXT NOT NULL,
    "voteId" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "VoteStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserVote_voteId_userId_key" ON "UserVote"("voteId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteOptions_voteId_name_key" ON "VoteOptions"("voteId", "name");

-- AddForeignKey
ALTER TABLE "UserVote" ADD CONSTRAINT "UserVote_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVote" ADD CONSTRAINT "UserVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteOptions" ADD CONSTRAINT "VoteOptions_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
