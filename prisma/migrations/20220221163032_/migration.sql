/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `Bounty` table. All the data in the column will be lost.
  - Added the required column `spaceId` to the `Bounty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "workspaceId",
ADD COLUMN     "spaceId" UUID NOT NULL;
