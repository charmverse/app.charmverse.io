-- CreateEnum
CREATE TYPE "MemberPropertyVisibilityView" AS ENUM ('gallery', 'table');

-- CreateTable
CREATE TABLE "MemberPropertyVisibility" (
    "id" UUID NOT NULL,
    "view" "MemberPropertyVisibilityView" NOT NULL,
    "memberPropertyId" UUID NOT NULL,

    CONSTRAINT "MemberPropertyVisibility_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemberPropertyVisibility" ADD CONSTRAINT "MemberPropertyVisibility_memberPropertyId_fkey" FOREIGN KEY ("memberPropertyId") REFERENCES "MemberProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
