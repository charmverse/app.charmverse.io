-- CreateEnum
CREATE TYPE "BountyOperation" AS ENUM ('work', 'review', 'view', 'edit', 'delete', 'lock', 'approve_applications', 'grant_permissions');

-- CreateEnum
CREATE TYPE "BountyPermissionLevel" AS ENUM ('reviewer', 'creator', 'submitter', 'viewer');

-- CreateTable
CREATE TABLE "BountyPermission" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "spaceId" UUID,
    "roleId" UUID,
    "public" BOOLEAN,
    "bountyId" UUID NOT NULL,
    "permissionLevel" "BountyPermissionLevel" NOT NULL,
    "operations" "BountyOperation"[],

    CONSTRAINT "BountyPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BountyPermission_userId_bountyId_permissionLevel_key" ON "BountyPermission"("userId", "bountyId", "permissionLevel");

-- CreateIndex
CREATE UNIQUE INDEX "BountyPermission_roleId_bountyId_permissionLevel_key" ON "BountyPermission"("roleId", "bountyId", "permissionLevel");

-- CreateIndex
CREATE UNIQUE INDEX "BountyPermission_spaceId_bountyId_permissionLevel_key" ON "BountyPermission"("spaceId", "bountyId", "permissionLevel");

-- CreateIndex
CREATE UNIQUE INDEX "BountyPermission_public_bountyId_permissionLevel_key" ON "BountyPermission"("public", "bountyId", "permissionLevel");

-- AddForeignKey
ALTER TABLE "BountyPermission" ADD CONSTRAINT "BountyPermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BountyPermission" ADD CONSTRAINT "BountyPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BountyPermission" ADD CONSTRAINT "BountyPermission_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BountyPermission" ADD CONSTRAINT "BountyPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
