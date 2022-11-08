/*
  Warnings:

  - You are about to drop the column `tokenGateConnectedDate` on the `SpaceRole` table. All the data in the column will be lost.
  - You are about to drop the column `tokenGateId` on the `SpaceRole` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpaceRole" DROP CONSTRAINT "SpaceRole_tokenGateId_fkey";

-- AlterTable
ALTER TABLE "SpaceRole" DROP COLUMN "tokenGateConnectedDate",
DROP COLUMN "tokenGateId",
ADD COLUMN     "joinedViaLink" BOOLEAN;

-- CreateTable
CREATE TABLE "UserTokenGate" (
    "id" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenGateConnectedDate" TIMESTAMP(3),
    "jwt" TEXT,
    "tokenGateId" UUID,
    "grantedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "UserTokenGate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTokenGate_tokenGateId_userId_spaceId_key" ON "UserTokenGate"("tokenGateId", "userId", "spaceId");

-- AddForeignKey
ALTER TABLE "UserTokenGate" ADD CONSTRAINT "UserTokenGate_tokenGateId_fkey" FOREIGN KEY ("tokenGateId") REFERENCES "TokenGate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTokenGate" ADD CONSTRAINT "UserTokenGate_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTokenGate" ADD CONSTRAINT "UserTokenGate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
