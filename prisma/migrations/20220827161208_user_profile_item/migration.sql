-- CreateEnum
CREATE TYPE "ProfileItemType" AS ENUM ('dao', 'nft', 'poap', 'vc');

-- CreateTable
CREATE TABLE "ProfileItem" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "isHidden" BOOLEAN,
    "metadata" JSONB,
    "type" "ProfileItemType" NOT NULL,
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "ProfileItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProfileItem" ADD CONSTRAINT "ProfileItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
