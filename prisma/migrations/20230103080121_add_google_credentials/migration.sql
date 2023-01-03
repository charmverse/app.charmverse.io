-- CreateTable
CREATE TABLE "GoogleCredential" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" UUID NOT NULL,
    "expiredAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "GoogleCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoogleCredential_userId_idx" ON "GoogleCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCredential_userId_name_key" ON "GoogleCredential"("userId", "name");

-- AddForeignKey
ALTER TABLE "GoogleCredential" ADD CONSTRAINT "GoogleCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
