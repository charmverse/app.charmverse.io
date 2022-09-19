-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'webapp');

-- AlterTable
ALTER TABLE "UserNotification" ADD COLUMN     "channel" "NotificationChannel";
