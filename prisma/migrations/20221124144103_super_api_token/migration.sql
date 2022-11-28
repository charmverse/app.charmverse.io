-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "superApiTokenId" UUID;

-- CreateTable
CREATE TABLE "SuperApiToken" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "SuperApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperApiToken_token_key" ON "SuperApiToken"("token");

-- CreateIndex
CREATE INDEX "SuperApiToken_token_idx" ON "SuperApiToken"("token");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_superApiTokenId_fkey" FOREIGN KEY ("superApiTokenId") REFERENCES "SuperApiToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
