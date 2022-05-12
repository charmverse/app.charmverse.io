-- CreateEnum
CREATE TYPE "RoleSource" AS ENUM ('guild_xyz');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "source" "RoleSource",
ADD COLUMN     "sourceId" TEXT;
