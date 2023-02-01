-- CreateEnum
CREATE TYPE "CategorySubscriptionMode" AS ENUM ('whitelist', 'blacklist');

-- CreateTable
CREATE TABLE "UserSpaceNotificationSettings" (
    "userId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "forumCategoriesMode" "CategorySubscriptionMode" NOT NULL DEFAULT 'blacklist',
    "forumCategories" TEXT[]
);

-- CreateIndex
CREATE INDEX "UserSpaceNotificationSettings_userId_spaceId_idx" ON "UserSpaceNotificationSettings"("userId", "spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSpaceNotificationSettings_userId_spaceId_key" ON "UserSpaceNotificationSettings"("userId", "spaceId");

-- AddForeignKey
ALTER TABLE "UserSpaceNotificationSettings" ADD CONSTRAINT "UserSpaceNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpaceNotificationSettings" ADD CONSTRAINT "UserSpaceNotificationSettings_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
