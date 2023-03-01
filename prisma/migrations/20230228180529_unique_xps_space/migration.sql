/*
  Warnings:

  - A unique constraint covering the columns `[xpsEngineId]` on the table `Space` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Space_xpsEngineId_key" ON "Space"("xpsEngineId");
