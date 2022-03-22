-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "DiscordUser" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "discordId" TEXT NOT NULL,
    "account" JSONB NOT NULL,

    CONSTRAINT "DiscordUser_pkey" PRIMARY KEY ("discordId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordUser_userId_key" ON "DiscordUser"("userId");

-- AddForeignKey
ALTER TABLE "DiscordUser" ADD CONSTRAINT "DiscordUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
