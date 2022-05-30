-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('Wallet', 'Discord', 'Telegram', 'Name');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identityType" "IdentityType";
