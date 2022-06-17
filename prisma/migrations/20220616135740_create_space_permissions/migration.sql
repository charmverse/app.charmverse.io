-- CreateEnum
CREATE TYPE "SpaceOperation" AS ENUM ('createPage', 'createBounty');

-- CreateTable
CREATE TABLE "SpacePermission" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operations" "SpaceOperation"[],
    "forSpaceId" UUID NOT NULL,
    "roleId" UUID,
    "spaceId" UUID,
    "userId" UUID,

    CONSTRAINT "SpacePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpacePermission_userId_forSpaceId_key" ON "SpacePermission"("userId", "forSpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SpacePermission_roleId_forSpaceId_key" ON "SpacePermission"("roleId", "forSpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SpacePermission_spaceId_forSpaceId_key" ON "SpacePermission"("spaceId", "forSpaceId");

-- AddForeignKey
ALTER TABLE "SpacePermission" ADD CONSTRAINT "SpacePermission_forSpaceId_fkey" FOREIGN KEY ("forSpaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacePermission" ADD CONSTRAINT "SpacePermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacePermission" ADD CONSTRAINT "SpacePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacePermission" ADD CONSTRAINT "SpacePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
