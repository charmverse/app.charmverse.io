-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_bountyId_fkey";

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
