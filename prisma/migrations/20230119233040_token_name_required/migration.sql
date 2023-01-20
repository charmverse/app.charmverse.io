/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `SuperApiToken` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `SuperApiToken` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SuperApiToken" ALTER COLUMN "name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SuperApiToken_name_key" ON "SuperApiToken"("name");
