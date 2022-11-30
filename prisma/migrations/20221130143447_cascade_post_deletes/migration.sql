-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_postId_fkey";

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
