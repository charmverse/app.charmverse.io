/*
  Warnings:

  - The values [createVote] on the enum `SpaceOperation` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SpaceOperation_new" AS ENUM ('createPage', 'createBounty', 'createForumCategory', 'moderateForums', 'reviewProposals');
ALTER TABLE "SpacePermission" ALTER COLUMN "operations" TYPE "SpaceOperation_new"[] USING ("operations"::text::"SpaceOperation_new"[]);
ALTER TYPE "SpaceOperation" RENAME TO "SpaceOperation_old";
ALTER TYPE "SpaceOperation_new" RENAME TO "SpaceOperation";
DROP TYPE "SpaceOperation_old";
COMMIT;
