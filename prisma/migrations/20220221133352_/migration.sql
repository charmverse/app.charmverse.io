/*
  Warnings:

  - You are about to drop the column `author` on the `Bounty` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Bounty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "author",
ADD COLUMN     "createdBy" UUID NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "descriptionNodes" DROP NOT NULL,
ALTER COLUMN "linkedTaskId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
