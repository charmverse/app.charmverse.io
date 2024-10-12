import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getPreviousSeason, getSeasonWeekFromISOWeek } from '@packages/scoutgame/dates';

export type WeeklyReward = {
  week: string;
  weekNumber: number;
  builderReward: {
    points: number;
  };
  githubContributionReward: {
    points: number;
    streakCount: number;
    firstContributionsCount: number;
    regularContributionsCount: number;
    bonusPartners: string[];
  };
  soldNftReward: {
    points: number;
    quantity: number;
  };
  rank: number | null;
};

export async function getClaimablePointsWithEvents(userId: string): Promise<{ totalClaimablePoints: number }> {
  const previousSeason = getPreviousSeason(currentSeason);
  const claimableSeasons = [previousSeason, currentSeason].filter(Boolean);
  if (claimableSeasons.length === 0) {
    throw new Error(`No seasons found to claim points: ${currentSeason}`);
  }
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: null,
      event: {
        season: {
          in: claimableSeasons
        }
      }
    },
    select: {
      value: true
    }
  });

  const totalClaimablePoints = pointsReceipts.reduce((acc, receipt) => acc + receipt.value, 0);

  return {
    totalClaimablePoints
  };
}
