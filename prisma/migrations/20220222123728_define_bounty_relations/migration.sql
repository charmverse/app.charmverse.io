/*
  Warnings:

  - The primary key for the `Bounty` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `author` on the `Bounty` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceId` on the `Bounty` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Bounty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spacedId` to the `Bounty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bounty" DROP CONSTRAINT "Bounty_pkey",
DROP COLUMN "author",
DROP COLUMN "workspaceId",
ADD COLUMN     "createdBy" UUID NOT NULL,
ADD COLUMN     "spacedId" UUID NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT E'open',
ADD CONSTRAINT "Bounty_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_spacedId_fkey" FOREIGN KEY ("spacedId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
