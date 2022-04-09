-- CreateTable
CREATE TABLE "SpaceApiToken" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" UUID NOT NULL,
    "token" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SpaceApiToken_token_spaceId_key" ON "SpaceApiToken"("token", "spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceApiToken_spaceId_key" ON "SpaceApiToken"("spaceId");

-- AddForeignKey
ALTER TABLE "SpaceApiToken" ADD CONSTRAINT "SpaceApiToken_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
