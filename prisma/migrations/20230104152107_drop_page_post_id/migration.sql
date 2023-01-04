/*
  Warnings:

  - You are about to drop the column `postId` on the `Page` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Page_postId_idx";

-- DropIndex
DROP INDEX "Page_postId_key";

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "postId";
