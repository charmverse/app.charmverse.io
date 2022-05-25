/*
  Warnings:

  - A unique constraint covering the columns `[public,pageId]` on the table `PagePermission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PagePermission_public_pageId_key" ON "PagePermission"("public", "pageId");
