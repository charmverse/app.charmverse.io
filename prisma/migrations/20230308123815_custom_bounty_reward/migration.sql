-- AlterTable
ALTER TABLE "Bounty" ADD COLUMN     "customReward" TEXT,
ALTER COLUMN "rewardAmount" DROP NOT NULL,
ALTER COLUMN "rewardToken" DROP NOT NULL,
ALTER COLUMN "chainId" DROP NOT NULL;
