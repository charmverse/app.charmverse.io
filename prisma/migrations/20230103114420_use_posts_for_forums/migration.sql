/*
  Warnings:

  - The values [post] on the enum `PageType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `PageComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PageCommentUpDownVote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PageUpDownVote` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentText` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PageType_new" AS ENUM ('board', 'board_template', 'bounty', 'bounty_template', 'page', 'page_template', 'card', 'card_template', 'proposal', 'proposal_template', 'inline_board', 'inline_linked_board');
ALTER TABLE "Page" ALTER COLUMN "type" TYPE "PageType_new" USING ("type"::text::"PageType_new");
ALTER TYPE "PageType" RENAME TO "PageType_old";
ALTER TYPE "PageType_new" RENAME TO "PageType";
DROP TYPE "PageType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_postId_fkey";

-- DropForeignKey
ALTER TABLE "PageComment" DROP CONSTRAINT "PageComment_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "PageComment" DROP CONSTRAINT "PageComment_pageId_fkey";

-- DropForeignKey
ALTER TABLE "PageCommentUpDownVote" DROP CONSTRAINT "PageCommentUpDownVote_commentId_fkey";

-- DropForeignKey
ALTER TABLE "PageCommentUpDownVote" DROP CONSTRAINT "PageCommentUpDownVote_pageId_fkey";

-- DropForeignKey
ALTER TABLE "PageUpDownVote" DROP CONSTRAINT "PageUpDownVote_pageId_fkey";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "content" JSONB NOT NULL,
ADD COLUMN     "contentText" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" UUID NOT NULL,
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "PageComment";

-- DropTable
DROP TABLE "PageCommentUpDownVote";

-- DropTable
DROP TABLE "PageUpDownVote";

-- CreateTable
CREATE TABLE "PostUpDownVote" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "upvoted" BOOLEAN NOT NULL,
    "postId" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "content" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "parentId" TEXT NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCommentUpDownVote" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "upvoted" BOOLEAN NOT NULL,
    "commentId" UUID NOT NULL,
    "postId" UUID NOT NULL
);

-- CreateIndex
CREATE INDEX "PostUpDownVote_postId_idx" ON "PostUpDownVote"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostUpDownVote_createdBy_postId_key" ON "PostUpDownVote"("createdBy", "postId");

-- CreateIndex
CREATE INDEX "PostComment_postId_idx" ON "PostComment"("postId");

-- CreateIndex
CREATE INDEX "PostCommentUpDownVote_commentId_idx" ON "PostCommentUpDownVote"("commentId");

-- CreateIndex
CREATE INDEX "PostCommentUpDownVote_postId_idx" ON "PostCommentUpDownVote"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostCommentUpDownVote_createdBy_commentId_key" ON "PostCommentUpDownVote"("createdBy", "commentId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostUpDownVote" ADD CONSTRAINT "PostUpDownVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCommentUpDownVote" ADD CONSTRAINT "PostCommentUpDownVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCommentUpDownVote" ADD CONSTRAINT "PostCommentUpDownVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
