import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getPreviousSeason } from '@packages/scoutgame/dates';
import { isTruthy } from '@root/lib/utils/types';

export async function getUnclaimedPoints(userId: string) {
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
  const bonusPartners = Array.from(
    new Set(pointsReceipts.map((receipt) => receipt.event.bonusPartner).filter(isTruthy))
  );

  return {
    totalUnclaimedPoints,
    bonusPartners
  };
}
