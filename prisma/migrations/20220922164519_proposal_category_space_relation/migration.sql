-- AddForeignKey
ALTER TABLE "ProposalCategory" ADD CONSTRAINT "ProposalCategory_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
