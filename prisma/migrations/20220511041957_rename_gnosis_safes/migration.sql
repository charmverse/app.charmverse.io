/*
  Warnings:

  - You are about to drop the `UserMultiSigWallet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserMultiSigWallet" DROP CONSTRAINT "UserMultiSigWallet_userId_fkey";

-- DropTable
DROP TABLE "UserMultiSigWallet";

-- CreateTable
CREATE TABLE "UserGnosisSafe" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "threshold" INTEGER NOT NULL,
    "owners" TEXT[],

    CONSTRAINT "UserGnosisSafe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserGnosisSafe" ADD CONSTRAINT "UserGnosisSafe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
