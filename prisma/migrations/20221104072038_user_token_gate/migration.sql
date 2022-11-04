/*
  Warnings:

  - You are about to drop the column `tokenGateConnectedDate` on the `SpaceRole` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SpaceRole" DROP COLUMN "tokenGateConnectedDate";

-- CreateTable
CREATE TABLE "UserTokenGate" (
    "id" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenGateConnectedDate" TIMESTAMP(3),
    "tokenGateId" UUID,
    "jwt" TEXT,

    CONSTRAINT "UserTokenGate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTokenGate_tokenGateId_userId_key" ON "UserTokenGate"("tokenGateId", "userId");

-- AddForeignKey
ALTER TABLE "UserTokenGate" ADD CONSTRAINT "UserTokenGate_tokenGateId_fkey" FOREIGN KEY ("tokenGateId") REFERENCES "TokenGate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTokenGate" ADD CONSTRAINT "UserTokenGate_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTokenGate" ADD CONSTRAINT "UserTokenGate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
