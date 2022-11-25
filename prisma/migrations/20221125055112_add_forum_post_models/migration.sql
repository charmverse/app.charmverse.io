/*
  Warnings:

  - A unique constraint covering the columns `[postId]` on the table `Page` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'published');

-- AlterEnum
ALTER TYPE "PageType" ADD VALUE 'PostVote';

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "postId" UUID;

-- CreateTable
CREATE TABLE "PostCategory" (
    "id" UUID NOT NULL,
    "color" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL,
    "categoryId" UUID,
    "status" "PostStatus" NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVote" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "upvoted" BOOLEAN NOT NULL,
    "pageId" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "content" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT NOT NULL,
    "pageId" UUID NOT NULL,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCommentVote" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "upvoted" BOOLEAN NOT NULL,
    "commentId" UUID NOT NULL
);

-- CreateIndex
CREATE INDEX "PostVote_pageId_idx" ON "PostVote"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PostVote_createdBy_pageId_key" ON "PostVote"("createdBy", "pageId");

-- CreateIndex
CREATE INDEX "PostComment_pageId_idx" ON "PostComment"("pageId");

-- CreateIndex
CREATE INDEX "PostCommentVote_commentId_idx" ON "PostCommentVote"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "PostCommentVote_createdBy_commentId_key" ON "PostCommentVote"("createdBy", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_postId_key" ON "Page"("postId");

-- CreateIndex
CREATE INDEX "Page_postId_idx" ON "Page"("postId");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PostCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCommentVote" ADD CONSTRAINT "PostCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
