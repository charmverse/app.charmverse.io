-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('Wallet', 'Discord', 'Telegram', 'RandomName');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identityType" "IdentityType";
