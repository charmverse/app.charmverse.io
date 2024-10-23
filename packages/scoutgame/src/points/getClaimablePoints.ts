import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason, getPreviousSeason } from '../dates';

export async function getClaimablePoints({ userId, week }: { week?: string; userId: string }): Promise<{
  points: number;
  bonusPartners: string[];
}> {
  const previousSeason = getPreviousSeason(currentSeason);
  const seasons = [previousSeason, currentSeason].filter(Boolean);
  if (seasons.length === 0) {
    throw new Error(`No seasons found to claim points: ${currentSeason}`);
  }
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: { equals: null },
      event: {
        week,
        season: {
          in: seasons
        }
      }
    },
    select: {
      value: true,
      event: {
        select: {
          bonusPartner: true
        }
      }
    }
  });

  const totalUnclaimedPoints = pointsReceipts.reduce((acc, receipt) => acc + receipt.value, 0);
  const bonusPartners = Array.from(new Set(pointsReceipts.map((receipt) => receipt.event.bonusPartner))).filter(
    (bp) => bp !== null
  ) as string[];

  return {
    points: totalUnclaimedPoints,
    bonusPartners
  };
}
