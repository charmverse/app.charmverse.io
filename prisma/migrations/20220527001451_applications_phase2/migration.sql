/*
  Warnings:

  - A unique constraint covering the columns `[bountyId,createdBy]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - Made the column `spaceId` on table `Application` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "spaceId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Application_bountyId_createdBy_key" ON "Application"("bountyId", "createdBy");
