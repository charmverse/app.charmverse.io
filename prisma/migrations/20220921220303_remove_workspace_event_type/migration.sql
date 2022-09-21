/*
  Warnings:

  - The values [proposal_create] on the enum `WorkspaceEventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WorkspaceEventType_new" AS ENUM ('proposal_status_change');
ALTER TABLE "WorkspaceEvent" ALTER COLUMN "type" TYPE "WorkspaceEventType_new" USING ("type"::text::"WorkspaceEventType_new");
ALTER TYPE "WorkspaceEventType" RENAME TO "WorkspaceEventType_old";
ALTER TYPE "WorkspaceEventType_new" RENAME TO "WorkspaceEventType";
DROP TYPE "WorkspaceEventType_old";
COMMIT;
