/*
  Warnings:

  - Made the column `id` on table `SpaceRole` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "SpaceRole_id_key" CASCADE;

-- AlterTable
ALTER TABLE "SpaceRole" ALTER COLUMN "id" SET NOT NULL,
ADD CONSTRAINT "SpaceRole_pkey" PRIMARY KEY ("id");
