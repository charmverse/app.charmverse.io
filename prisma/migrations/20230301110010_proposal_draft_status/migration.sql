/*
  Warnings:

  - The values [private_draft] on the enum `ProposalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProposalStatus_new" AS ENUM ('draft', 'discussion', 'review', 'reviewed', 'vote_active', 'vote_closed');
ALTER TABLE "Proposal" ALTER COLUMN "status" TYPE "ProposalStatus_new" USING ("status"::text::"ProposalStatus_new");
ALTER TYPE "ProposalStatus" RENAME TO "ProposalStatus_old";
ALTER TYPE "ProposalStatus_new" RENAME TO "ProposalStatus";
DROP TYPE "ProposalStatus_old";
COMMIT;
