-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('multisig');

-- CreateTable
CREATE TABLE "UserNotification" (
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_taskId_key" ON "UserNotification"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_taskId_userId_key" ON "UserNotification"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
