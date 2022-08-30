/*
  Warnings:

  - The values [dao] on the enum `ProfileItemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProfileItemType_new" AS ENUM ('community', 'nft', 'poap', 'vc');
ALTER TABLE "ProfileItem" ALTER COLUMN "type" TYPE "ProfileItemType_new" USING ("type"::text::"ProfileItemType_new");
ALTER TYPE "ProfileItemType" RENAME TO "ProfileItemType_old";
ALTER TYPE "ProfileItemType_new" RENAME TO "ProfileItemType";
DROP TYPE "ProfileItemType_old";
COMMIT;
