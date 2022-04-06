-- AlterTable
ALTER TABLE "User" ADD COLUMN     "token" TEXT;

-- CreateTable
CREATE TABLE "SpaceToken" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" UUID NOT NULL,
    "token" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SpaceToken_token_spaceId_key" ON "SpaceToken"("token", "spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceToken_spaceId_key" ON "SpaceToken"("spaceId");

-- AddForeignKey
ALTER TABLE "SpaceToken" ADD CONSTRAINT "SpaceToken_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
