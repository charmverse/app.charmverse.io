-- CreateEnum
CREATE TYPE "VoteContext" AS ENUM ('inline', 'proposal');

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "context" "VoteContext" NOT NULL DEFAULT 'inline';
