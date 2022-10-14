/*
  Warnings:

  - A unique constraint covering the columns `[memberPropertyId,spaceId,userId]` on the table `MemberPropertyValue` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MemberPropertyValue_memberPropertyId_spaceId_userId_key" ON "MemberPropertyValue"("memberPropertyId", "spaceId", "userId");
