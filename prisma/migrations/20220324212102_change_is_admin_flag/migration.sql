/*
  Warnings:

  - You are about to drop the column `isRoot` on the `SpaceRole` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SpaceRole" DROP COLUMN "isRoot",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
