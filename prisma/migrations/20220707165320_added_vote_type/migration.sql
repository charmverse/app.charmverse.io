-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('Approval', 'SingleChoice');

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "type" "VoteType" NOT NULL DEFAULT E'SingleChoice';
