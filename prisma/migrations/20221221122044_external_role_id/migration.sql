-- AlterEnum
ALTER TYPE "RoleSource" ADD VALUE 'collabland';

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "externalId" TEXT;
