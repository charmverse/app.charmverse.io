/*
  Warnings:

  - A unique constraint covering the columns `[applicationId]` on the table `Thread` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "applicationId" UUID,
ALTER COLUMN "pageId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Thread_applicationId_key" ON "Thread"("applicationId");

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
