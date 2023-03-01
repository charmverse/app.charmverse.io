/*
  Warnings:

  - A unique constraint covering the columns `[xpsEngineId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "xpsEngineId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_xpsEngineId_key" ON "User"("xpsEngineId");
