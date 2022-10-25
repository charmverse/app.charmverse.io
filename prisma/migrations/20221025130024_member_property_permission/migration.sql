-- CreateEnum
CREATE TYPE "MemberPropertyPermissionLevel" AS ENUM ('view');

-- CreateTable
CREATE TABLE "MemberPropertyPermission" (
    "id" UUID NOT NULL,
    "roleId" UUID,
    "memberPropertyPermissionLevel" "MemberPropertyPermissionLevel" NOT NULL,
    "memberPropertyId" UUID NOT NULL,

    CONSTRAINT "MemberPropertyPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberPropertyPermission_roleId_memberPropertyId_key" ON "MemberPropertyPermission"("roleId", "memberPropertyId");

-- AddForeignKey
ALTER TABLE "MemberPropertyPermission" ADD CONSTRAINT "MemberPropertyPermission_memberPropertyId_fkey" FOREIGN KEY ("memberPropertyId") REFERENCES "MemberProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPropertyPermission" ADD CONSTRAINT "MemberPropertyPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
