/*
  Warnings:

  - Made the column `spaceId` on table `Page` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "spaceId" SET NOT NULL;
