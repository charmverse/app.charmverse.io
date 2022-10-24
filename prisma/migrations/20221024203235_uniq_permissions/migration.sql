/*
  Warnings:

  - You are about to drop the column `public` on the `MemberPropertyPermission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,memberPropertyId]` on the table `MemberPropertyPermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,memberPropertyId]` on the table `MemberPropertyPermission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MemberPropertyPermission" DROP COLUMN "public";

-- CreateIndex
CREATE UNIQUE INDEX "MemberPropertyPermission_userId_memberPropertyId_key" ON "MemberPropertyPermission"("userId", "memberPropertyId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberPropertyPermission_roleId_memberPropertyId_key" ON "MemberPropertyPermission"("roleId", "memberPropertyId");
