-- CreateTable
CREATE TABLE "UserMultiSigWallet" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "walletType" "WalletType" NOT NULL DEFAULT E'metamask',

    CONSTRAINT "UserMultiSigWallet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserMultiSigWallet" ADD CONSTRAINT "UserMultiSigWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
