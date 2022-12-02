-- AlterEnum
ALTER TYPE "IdentityType" ADD VALUE 'UnstoppableDomain';

-- CreateTable
CREATE TABLE "UnstoppableDomain" (
    "id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "UnstoppableDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnstoppableDomain_domain_key" ON "UnstoppableDomain"("domain");

-- AddForeignKey
ALTER TABLE "UnstoppableDomain" ADD CONSTRAINT "UnstoppableDomain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
