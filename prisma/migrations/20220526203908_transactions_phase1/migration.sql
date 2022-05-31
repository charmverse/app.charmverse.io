-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "applicationId" UUID,
ALTER COLUMN "bountyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
