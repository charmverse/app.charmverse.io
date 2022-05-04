/*
  Warnings:

  - The `role` column on the `SpaceRole` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `userRole` column on the `TokenGate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[id]` on the table `SpaceRole` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SpaceRole" ADD COLUMN     "id" UUID,
ADD COLUMN     "isRoot" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT E'contributor';

-- AlterTable
ALTER TABLE "TokenGate" DROP COLUMN "userRole",
ADD COLUMN     "userRole" TEXT;

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "spaceId" UUID NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceRoleToRole" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceRoleId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "SpaceRoleToRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_spaceId_name_key" ON "Role"("spaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceRoleToRole_spaceRoleId_roleId_key" ON "SpaceRoleToRole"("spaceRoleId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceRole_id_key" ON "SpaceRole"("id");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceRoleToRole" ADD CONSTRAINT "SpaceRoleToRole_spaceRoleId_fkey" FOREIGN KEY ("spaceRoleId") REFERENCES "SpaceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceRoleToRole" ADD CONSTRAINT "SpaceRoleToRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
