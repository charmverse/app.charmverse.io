/*
  Warnings:

  - A unique constraint covering the columns `[postId]` on the table `Page` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'published');

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "postId" UUID;

-- CreateTable
CREATE TABLE "PostCategory" (
    "id" UUID NOT NULL,
    "color" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spaceId" UUID NOT NULL,

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
CREATE TABLE "PageUpDownVote" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "upvoted" BOOLEAN NOT NULL,
    "pageId" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "PageComment" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "content" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT NOT NULL,
    "pageId" UUID NOT NULL,

    CONSTRAINT "PageComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageCommentUpDownVote" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "upvoted" BOOLEAN NOT NULL,
    "commentId" UUID NOT NULL,
    "pageId" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_spaceId_key" ON "PostCategory"("spaceId");

-- CreateIndex
CREATE INDEX "PageUpDownVote_pageId_idx" ON "PageUpDownVote"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageUpDownVote_createdBy_pageId_key" ON "PageUpDownVote"("createdBy", "pageId");

-- CreateIndex
CREATE INDEX "PageComment_pageId_idx" ON "PageComment"("pageId");

-- CreateIndex
CREATE INDEX "PageCommentUpDownVote_commentId_idx" ON "PageCommentUpDownVote"("commentId");

-- CreateIndex
CREATE INDEX "PageCommentUpDownVote_pageId_idx" ON "PageCommentUpDownVote"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageCommentUpDownVote_createdBy_commentId_key" ON "PageCommentUpDownVote"("createdBy", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_postId_key" ON "Page"("postId");

-- CreateIndex
CREATE INDEX "Page_postId_idx" ON "Page"("postId");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PostCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageUpDownVote" ADD CONSTRAINT "PageUpDownVote_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageCommentUpDownVote" ADD CONSTRAINT "PageCommentUpDownVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PageComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageCommentUpDownVote" ADD CONSTRAINT "PageCommentUpDownVote_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
