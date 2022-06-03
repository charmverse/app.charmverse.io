-- CreateTable
CREATE TABLE "UserNotificationState" (
    "snoozedUntil" TIMESTAMP(3),
    "snoozeMessage" TEXT,
    "userId" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationState_userId_key" ON "UserNotificationState"("userId");

-- AddForeignKey
ALTER TABLE "UserNotificationState" ADD CONSTRAINT "UserNotificationState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
