/*
  Warnings:

  - A unique constraint covering the columns `[spaceId,name]` on the table `PostCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PostCategory_spaceId_key";

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_spaceId_name_key" ON "PostCategory"("spaceId", "name");
