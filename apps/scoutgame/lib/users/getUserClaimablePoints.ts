import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/utils';

export async function getUserClaimablePoints(userId: string) {
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: null,
      event: {
        // TODO: Should consider previous seasons too
        season: currentSeason
      }
    },
    select: {
      value: true,
      recipientId: true,
      event: {
        select: {
          week: true,
          type: true,
          builderId: true,
          nftPurchaseEvent: {
            select: {
              tokensPurchased: true
            }
          },
          gemsReceipt: {
            select: {
              type: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const totalClaimablePoints = pointsReceipts.reduce((acc, receipt) => acc + receipt.value, 0);

  const builderRewards: Record<string, { week: string; points: number }> = {};
  const soldNftRewards: Record<string, { week: string; points: number; quantity: number }> = {};
  const githubContributionRewards: Record<
    string,
    {
      week: string;
      points: number;
      streakCount: number;
      firstContributionsCount: number;
      regularContributionsCount: number;
    }
  > = {};

  for (const receipt of pointsReceipts) {
    const points = receipt.value;
    const week = receipt.event.week;
    if (receipt.event.type === 'nft_purchase' && receipt.event.nftPurchaseEvent) {
      const soldNftReward = soldNftRewards[week];
      if (!soldNftReward) {
        soldNftRewards[week] = {
          week,
          points: 0,
          quantity: 0
        };
      }
      soldNftReward.points += receipt.value;
      soldNftReward.quantity += receipt.event.nftPurchaseEvent.tokensPurchased ?? 1;
    } else if (receipt.event.type === 'gems_payout') {
      if (receipt.event.gemsReceipt) {
        const githubContributionReward = githubContributionRewards[week];
        if (!githubContributionReward) {
          githubContributionRewards[week] = {
            points: 0,
            week,
            firstContributionsCount: 0,
            regularContributionsCount: 0,
            streakCount: 0
          };
        }
        githubContributionReward.points += points;
        if (receipt.event.gemsReceipt.type === 'first_pr') {
          githubContributionReward.firstContributionsCount += 1;
        } else if (receipt.event.gemsReceipt.type === 'regular_pr') {
          githubContributionReward.regularContributionsCount += 1;
        } else if (receipt.event.gemsReceipt.type === 'third_pr_in_streak') {
          githubContributionReward.streakCount += 1;
        }
      } else if (receipt.event.builderId !== receipt.recipientId) {
        const builderReward = builderRewards[week];
        if (!builderReward) {
          builderRewards[week] = {
            points: 0,
            week
          };
        }
        builderReward.points += points;
      }
    }
  }

  return {
    totalClaimablePoints,
    builderRewards,
    githubContributionRewards,
    soldNftRewards
  };
}
