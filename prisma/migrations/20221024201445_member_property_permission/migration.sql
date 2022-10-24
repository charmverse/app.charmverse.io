-- CreateEnum
CREATE TYPE "MemberPropertyPermissionLevel" AS ENUM ('view');

-- CreateTable
CREATE TABLE "MemberPropertyPermission" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "spaceId" UUID,
    "roleId" UUID,
    "public" BOOLEAN,
    "memberPropertyPermissionLevel" "MemberPropertyPermissionLevel" NOT NULL,
    "memberPropertyId" UUID NOT NULL,

    CONSTRAINT "MemberPropertyPermission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemberPropertyPermission" ADD CONSTRAINT "MemberPropertyPermission_memberPropertyId_fkey" FOREIGN KEY ("memberPropertyId") REFERENCES "MemberProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPropertyPermission" ADD CONSTRAINT "MemberPropertyPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPropertyPermission" ADD CONSTRAINT "MemberPropertyPermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPropertyPermission" ADD CONSTRAINT "MemberPropertyPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
