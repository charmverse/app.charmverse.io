/*
  Warnings:

  - A unique constraint covering the columns `[spaceId,path]` on the table `PostCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PostCategory" ADD COLUMN     "path" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_spaceId_path_key" ON "PostCategory"("spaceId", "path");
