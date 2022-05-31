/*
  Warnings:

  - A unique constraint covering the columns `[path]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_path_key" ON "User"("path");
