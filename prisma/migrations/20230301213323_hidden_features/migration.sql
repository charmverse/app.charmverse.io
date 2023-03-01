-- CreateEnum
CREATE TYPE "Feature" AS ENUM ('member_directory', 'proposals', 'forum', 'bounties');

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "hiddenFeatures" "Feature"[];
