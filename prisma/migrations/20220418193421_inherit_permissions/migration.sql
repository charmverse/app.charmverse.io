-- AlterTable
ALTER TABLE "PagePermission" ADD COLUMN     "inheritedFromPermission" UUID;

-- AddForeignKey
ALTER TABLE "PagePermission" ADD CONSTRAINT "PagePermission_inheritedFromPermission_fkey" FOREIGN KEY ("inheritedFromPermission") REFERENCES "PagePermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
