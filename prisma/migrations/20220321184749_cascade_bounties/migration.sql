-- DropForeignKey
ALTER TABLE "Bounty" DROP CONSTRAINT "Bounty_spaceId_fkey";

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
