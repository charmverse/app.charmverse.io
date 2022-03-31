/*
  Warnings:

  - You are about to drop the column `level` on the `PagePermission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,pageId]` on the table `PagePermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,pageId]` on the table `PagePermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[spaceId,pageId]` on the table `PagePermission` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `PagePermission` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `permissionLevel` to the `PagePermission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PagePermissionLevel" AS ENUM ('full_access', 'editor', 'view_comment', 'view', 'custom');

-- CreateEnum
CREATE TYPE "PageOperations" AS ENUM ('read', 'delete', 'edit_position', 'edit_content', 'edit_isPublic', 'edit_path', 'grant_permissions');

-- DropIndex
DROP INDEX "PagePermission_pageId_userId_key";

-- AlterTable
ALTER TABLE "PagePermission" DROP COLUMN "level",
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "permissionLevel" "PagePermissionLevel" NOT NULL,
ADD COLUMN     "permissions" "PageOperations"[],
ADD COLUMN     "roleId" UUID,
ADD COLUMN     "spaceId" UUID,
ALTER COLUMN "userId" DROP NOT NULL,
ADD CONSTRAINT "PagePermission_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "PagePermission_userId_pageId_key" ON "PagePermission"("userId", "pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PagePermission_roleId_pageId_key" ON "PagePermission"("roleId", "pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PagePermission_spaceId_pageId_key" ON "PagePermission"("spaceId", "pageId");

-- AddForeignKey
ALTER TABLE "PagePermission" ADD CONSTRAINT "PagePermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagePermission" ADD CONSTRAINT "PagePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
