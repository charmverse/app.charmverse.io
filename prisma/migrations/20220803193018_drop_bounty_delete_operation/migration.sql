/*
  Warnings:

  - The values [delete] on the enum `BountyOperation` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BountyOperation_new" AS ENUM ('work', 'review', 'lock', 'approve_applications', 'grant_permissions');
ALTER TABLE "BountyPermission" ALTER COLUMN "operations" TYPE "BountyOperation_new"[] USING ("operations"::text::"BountyOperation_new"[]);
ALTER TYPE "BountyOperation" RENAME TO "BountyOperation_old";
ALTER TYPE "BountyOperation_new" RENAME TO "BountyOperation";
DROP TYPE "BountyOperation_old";
COMMIT;
