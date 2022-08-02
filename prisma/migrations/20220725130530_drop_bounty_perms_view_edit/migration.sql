/*
  Warnings:

  - The values [view,edit] on the enum `BountyOperation` will be removed. If these variants are still used in the database, this will fail.
  - The values [viewer] on the enum `BountyPermissionLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BountyOperation_new" AS ENUM ('work', 'review', 'delete', 'lock', 'approve_applications', 'grant_permissions');
ALTER TABLE "BountyPermission" ALTER COLUMN "operations" TYPE "BountyOperation_new"[] USING ("operations"::text::"BountyOperation_new"[]);
ALTER TYPE "BountyOperation" RENAME TO "BountyOperation_old";
ALTER TYPE "BountyOperation_new" RENAME TO "BountyOperation";
DROP TYPE "BountyOperation_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BountyPermissionLevel_new" AS ENUM ('reviewer', 'creator', 'submitter');
ALTER TABLE "BountyPermission" ALTER COLUMN "permissionLevel" TYPE "BountyPermissionLevel_new" USING ("permissionLevel"::text::"BountyPermissionLevel_new");
ALTER TYPE "BountyPermissionLevel" RENAME TO "BountyPermissionLevel_old";
ALTER TYPE "BountyPermissionLevel_new" RENAME TO "BountyPermissionLevel";
DROP TYPE "BountyPermissionLevel_old";
COMMIT;
