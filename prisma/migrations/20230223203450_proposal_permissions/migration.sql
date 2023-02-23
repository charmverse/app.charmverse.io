/*
  Warnings:

  - A unique constraint covering the columns `[spaceId,title]` on the table `ProposalCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
-- UNDO
-- CREATE TYPE "ProposalCategoryOperation" AS ENUM ('manage_permissions', 'create_proposal', 'edit', 'delete');

-- CreateEnum
-- UNDO
-- CREATE TYPE "ProposalOperation" AS ENUM ('edit', 'view', 'delete', 'create_vote', 'vote', 'comment', 'review');

-- CreateEnum
-- UNDO
-- CREATE TYPE  "ProposalCategoryPermissionLevel" AS ENUM ('view', 'view_comment', 'view_comment_vote', 'full_access');

-- AlterEnum
-- UNDO
-- ALTER TYPE "SpaceOperation" ADD VALUE 'reviewProposals';

-- CreateTable
-- UNDO // If not exists
CREATE TABLE IF NOT EXISTS "ProposalCategoryPermission" (
    "id" UUID NOT NULL,
    "permissionLevel" "ProposalCategoryPermissionLevel" NOT NULL,
    "proposalCategoryId" UUID NOT NULL,
    "categoryOperations" "ProposalCategoryOperation"[],
    "proposalOperations" "ProposalOperation"[],
    "roleId" UUID,
    "spaceId" UUID,
    "public" BOOLEAN,

    CONSTRAINT "ProposalCategoryPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- CREATE INDEX "ProposalCategoryPermission_proposalCategoryId_idx" ON "ProposalCategoryPermission"("proposalCategoryId");

-- CreateIndex
-- CREATE INDEX "ProposalCategoryPermission_proposalCategoryId_roleId_idx" ON "ProposalCategoryPermission"("proposalCategoryId", "roleId");

-- CreateIndex
-- CREATE INDEX "ProposalCategoryPermission_proposalCategoryId_spaceId_idx" ON "ProposalCategoryPermission"("proposalCategoryId", "spaceId");

-- CreateIndex
-- CREATE INDEX "ProposalCategoryPermission_proposalCategoryId_public_idx" ON "ProposalCategoryPermission"("proposalCategoryId", "public");

-- CreateIndex
-- CREATE UNIQUE INDEX "ProposalCategoryPermission_roleId_proposalCategoryId_key" ON "ProposalCategoryPermission"("roleId", "proposalCategoryId");

-- CreateIndex
-- CREATE UNIQUE INDEX "ProposalCategoryPermission_spaceId_proposalCategoryId_key" ON "ProposalCategoryPermission"("spaceId", "proposalCategoryId");

-- CreateIndex
-- CREATE UNIQUE INDEX "ProposalCategoryPermission_public_proposalCategoryId_key" ON "ProposalCategoryPermission"("public", "proposalCategoryId");

-- CreateIndex
-- CREATE UNIQUE INDEX "ProposalCategory_spaceId_title_key" ON "ProposalCategory"("spaceId", "title");

-- AddForeignKey
-- ALTER TABLE "ProposalCategoryPermission" ADD CONSTRAINT "ProposalCategoryPermission_proposalCategoryId_fkey" FOREIGN KEY ("proposalCategoryId") REFERENCES "ProposalCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE "ProposalCategoryPermission" ADD CONSTRAINT "ProposalCategoryPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE "ProposalCategoryPermission" ADD CONSTRAINT "ProposalCategoryPermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
