-- CreateEnum
CREATE TYPE "ProposalCategoryOperation" AS ENUM ('create_proposal', 'edit', 'delete');

-- CreateEnum
CREATE TYPE "ProposalOperation" AS ENUM ('edit', 'view', 'delete', 'create_vote', 'vote', 'comment', 'review');

-- CreateEnum
CREATE TYPE "ProposalCategoryPermissionLevel" AS ENUM ('view', 'view_comment', 'view_comment_vote', 'full_access');

-- CreateTable
CREATE TABLE "ProposalCategoryPermission" (
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
CREATE INDEX "ProposalCategoryPermission_proposalCategoryId_idx" ON "ProposalCategoryPermission"("proposalCategoryId");

-- CreateIndex
CREATE INDEX "ProposalCategoryPermission_proposalCategoryId_roleId_idx" ON "ProposalCategoryPermission"("proposalCategoryId", "roleId");

-- CreateIndex
CREATE INDEX "ProposalCategoryPermission_proposalCategoryId_spaceId_idx" ON "ProposalCategoryPermission"("proposalCategoryId", "spaceId");

-- CreateIndex
CREATE INDEX "ProposalCategoryPermission_proposalCategoryId_public_idx" ON "ProposalCategoryPermission"("proposalCategoryId", "public");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalCategoryPermission_roleId_proposalCategoryId_key" ON "ProposalCategoryPermission"("roleId", "proposalCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalCategoryPermission_spaceId_proposalCategoryId_key" ON "ProposalCategoryPermission"("spaceId", "proposalCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalCategoryPermission_public_proposalCategoryId_key" ON "ProposalCategoryPermission"("public", "proposalCategoryId");

-- AddForeignKey
ALTER TABLE "ProposalCategoryPermission" ADD CONSTRAINT "ProposalCategoryPermission_proposalCategoryId_fkey" FOREIGN KEY ("proposalCategoryId") REFERENCES "ProposalCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalCategoryPermission" ADD CONSTRAINT "ProposalCategoryPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalCategoryPermission" ADD CONSTRAINT "ProposalCategoryPermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
