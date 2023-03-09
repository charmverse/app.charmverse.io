-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNewsletter" BOOLEAN DEFAULT false,
ADD COLUMN     "emailNotifications" BOOLEAN DEFAULT true;
