-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "superApiTokenId" TEXT;

-- CreateTable
CREATE TABLE "SuperApiToken" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" TEXT NOT NULL,
    "name" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperApiToken_token_key" ON "SuperApiToken"("token");

-- CreateIndex
CREATE INDEX "SuperApiToken_token_idx" ON "SuperApiToken"("token");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_superApiTokenId_fkey" FOREIGN KEY ("superApiTokenId") REFERENCES "SuperApiToken"("token") ON DELETE SET NULL ON UPDATE CASCADE;
