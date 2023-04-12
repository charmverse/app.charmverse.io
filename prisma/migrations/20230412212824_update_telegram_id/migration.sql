/*
  Warnings:

  - The primary key for the `TelegramUser` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "TelegramUser" DROP CONSTRAINT "TelegramUser_pkey",
ALTER COLUMN "telegramId" SET DATA TYPE BIGINT,
ADD CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("telegramId");
