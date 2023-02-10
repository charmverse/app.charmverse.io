/*
  Warnings:

  - A unique constraint covering the columns `[spaceId,path]` on the table `Post` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserDetails" ADD COLUMN     "locale" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Post_spaceId_path_key" ON "Post"("spaceId", "path");
