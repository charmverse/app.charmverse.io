-- AlterEnum
ALTER TYPE "IdentityType" ADD VALUE 'VerifiedEmail';

-- CreateTable
CREATE TABLE "VerifiedEmail" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "VerifiedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedEmail_email_key" ON "VerifiedEmail"("email");

-- CreateIndex
CREATE INDEX "VerifiedEmail_email_idx" ON "VerifiedEmail"("email");

-- CreateIndex
CREATE INDEX "VerifiedEmail_userId_idx" ON "VerifiedEmail"("userId");

-- AddForeignKey
ALTER TABLE "VerifiedEmail" ADD CONSTRAINT "VerifiedEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
