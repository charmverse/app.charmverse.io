/*
  Warnings:

  - Added the required column `identityType` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identityType" TEXT NULL;

UPDATE "User" u SET "identityType" = 'Address' WHERE "identityType" IS NULL AND "addresses" IS NOT NULL;
UPDATE "User" u SET "identityType" = 'Discord' WHERE "identityType" IS NULL AND EXISTS (SELECT 1 from "DiscordUser" du WHERE u."id" = du."userId");
UPDATE "User" u SET "identityType" = 'Telegram' WHERE "identityType" IS NULL AND EXISTS (SELECT 1 from "TelegramUser" tu WHERE u."id" = tu."userId");

ALTER TABLE "User" ALTER COLUMN "identityType" SET NOT NULL;
