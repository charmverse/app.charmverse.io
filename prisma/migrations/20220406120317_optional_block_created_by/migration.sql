-- DropForeignKey
ALTER TABLE "Block" DROP CONSTRAINT "Block_createdBy_fkey";

-- AlterTable
ALTER TABLE "Block" ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
