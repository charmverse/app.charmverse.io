/*
  Warnings:

  - A unique constraint covering the columns `[cardId]` on the table `Page` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Page_cardId_key" ON "Page"("cardId");
