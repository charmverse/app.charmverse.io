-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
