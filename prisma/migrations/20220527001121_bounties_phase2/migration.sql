/*
  Warnings:

  - The values [assigned,review] on the enum `BountyStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assignee` on the `Bounty` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BountyStatus_new" AS ENUM ('suggestion', 'open', 'inProgress', 'complete', 'paid');
ALTER TABLE "Bounty" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Bounty" ALTER COLUMN "status" TYPE "BountyStatus_new" USING ("status"::text::"BountyStatus_new");
ALTER TYPE "BountyStatus" RENAME TO "BountyStatus_old";
ALTER TYPE "BountyStatus_new" RENAME TO "BountyStatus";
DROP TYPE "BountyStatus_old";
ALTER TABLE "Bounty" ALTER COLUMN "status" SET DEFAULT 'open';
COMMIT;

-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "assignee";
