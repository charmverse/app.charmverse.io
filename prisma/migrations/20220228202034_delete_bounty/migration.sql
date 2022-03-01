-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_bountyId_fkey";

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
