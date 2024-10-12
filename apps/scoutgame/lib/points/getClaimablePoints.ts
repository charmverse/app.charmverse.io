import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getPreviousSeason } from '@packages/scoutgame/dates';

export async function getClaimablePoints(userId: string): Promise<{ totalClaimablePoints: number }> {
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
