-- CreateTable
CREATE TABLE "PageComment" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "content" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "parentId" TEXT,
    "pageId" UUID NOT NULL,

    CONSTRAINT "PageComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageCommentVote" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "upvoted" BOOLEAN NOT NULL,
    "commentId" UUID NOT NULL
);

-- CreateIndex
CREATE INDEX "PageComment_pageId_idx" ON "PageComment"("pageId");

-- CreateIndex
CREATE INDEX "PageCommentVote_commentId_idx" ON "PageCommentVote"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "PageCommentVote_createdBy_commentId_key" ON "PageCommentVote"("createdBy", "commentId");

-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageCommentVote" ADD CONSTRAINT "PageCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PageComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
