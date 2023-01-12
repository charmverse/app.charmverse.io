/*
  Warnings:

  - A unique constraint covering the columns `[defaultPostCategoryId]` on the table `Space` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "defaultPostCategoryId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Space_defaultPostCategoryId_key" ON "Space"("defaultPostCategoryId");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_defaultPostCategoryId_fkey" FOREIGN KEY ("defaultPostCategoryId") REFERENCES "PostCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
