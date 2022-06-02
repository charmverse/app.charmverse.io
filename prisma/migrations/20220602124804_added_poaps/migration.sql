-- CreateTable
CREATE TABLE "Poap" (
    "id" UUID NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "isHidden" BOOLEAN,

    CONSTRAINT "Poap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Poap_tokenId_key" ON "Poap"("tokenId");

-- AddForeignKey
ALTER TABLE "Poap" ADD CONSTRAINT "Poap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
