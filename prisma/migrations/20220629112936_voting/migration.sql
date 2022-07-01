-- CreateEnum
CREATE TYPE "VoteStatus" AS ENUM ('InProgress', 'Passed', 'Rejected', 'Cancelled');

-- CreateTable
CREATE TABLE "UserVote" (
    "voteId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "choice" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "initiatorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB,
    "deadline" TIMESTAMP(3) NOT NULL,
    "options" JSONB NOT NULL,
    "status" "VoteStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserVote_voteId_key" ON "UserVote"("voteId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVote_userId_key" ON "UserVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVote_voteId_userId_key" ON "UserVote"("voteId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_initiatorId_key" ON "Vote"("initiatorId");

-- AddForeignKey
ALTER TABLE "UserVote" ADD CONSTRAINT "UserVote_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVote" ADD CONSTRAINT "UserVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
