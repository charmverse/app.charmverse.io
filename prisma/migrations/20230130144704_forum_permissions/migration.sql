-- CreateEnum
CREATE TYPE "PostCategoryOperation" AS ENUM ('manage_permissions', 'delete_category', 'edit_category');

-- CreateEnum
CREATE TYPE "PostOperation" AS ENUM ('view_post', 'edit_post', 'delete_post', 'pin_post', 'lock_post', 'add_comment', 'delete_comments');

-- CreateEnum
CREATE TYPE "PostCategoryPermissionLevel" AS ENUM ('category_admin', 'moderator', 'member', 'guest', 'custom');

-- AlterEnum
ALTER TYPE "SpaceOperation" ADD VALUE 'createForumCategory';

-- CreateTable
CREATE TABLE "PostCategoryPermission" (
    "id" UUID NOT NULL,
    "permissionLevel" "PostCategoryPermissionLevel" NOT NULL,
    "postCategoryId" UUID NOT NULL,
    "categoryOperations" "PostCategoryOperation"[],
    "postOperations" "PostOperation"[],
    "roleId" UUID,
    "spaceId" UUID,
    "public" BOOLEAN,

    CONSTRAINT "PostCategoryPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostCategoryPermission_roleId_postCategoryId_key" ON "PostCategoryPermission"("roleId", "postCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategoryPermission_spaceId_postCategoryId_key" ON "PostCategoryPermission"("spaceId", "postCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategoryPermission_public_postCategoryId_key" ON "PostCategoryPermission"("public", "postCategoryId");

-- AddForeignKey
ALTER TABLE "PostCategoryPermission" ADD CONSTRAINT "PostCategoryPermission_postCategoryId_fkey" FOREIGN KEY ("postCategoryId") REFERENCES "PostCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategoryPermission" ADD CONSTRAINT "PostCategoryPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategoryPermission" ADD CONSTRAINT "PostCategoryPermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
