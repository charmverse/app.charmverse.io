/*
  Warnings:

  - You are about to drop the column `status` on the `Post` table. All the data in the column will be lost.
  - Made the column `categoryId` on table `Post` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_categoryId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "status",
ALTER COLUMN "categoryId" SET NOT NULL;

-- DropEnum
DROP TYPE "PostStatus";

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PostCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
