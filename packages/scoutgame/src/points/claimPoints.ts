import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason, seasons } from '../dates';

export async function claimPoints({ season = currentSeason, userId }: { season?: string; userId: string }) {
  const previousSeason = seasons.findLast((s) => s.start < season)?.start;
  const seasonsToQuery = previousSeason ? [previousSeason, season] : [season];
  const pointsReceipts = await prisma.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      claimedAt: null,
      event: {
        season: { in: seasonsToQuery }
      }
    },
    select: {
      id: true,
      value: true,
      recipientId: true,
      event: {
        select: {
          type: true,
          builderId: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  let builderPoints = 0;
  let scoutPoints = 0;

  for (const receipt of pointsReceipts) {
    const points = receipt.value;
    if (receipt.event.type === 'nft_purchase') {
      builderPoints += points;
    } else if (receipt.event.type === 'gems_payout') {
      if (receipt.event.builderId !== receipt.recipientId) {
        scoutPoints += points;
      } else {
        builderPoints += points;
      }
    } else {
      builderPoints += points;
    }
  }

  return prisma.$transaction([
    prisma.pointsReceipt.updateMany({
      where: {
        id: {
          in: pointsReceipts.map((r) => r.id)
        }
      },
      data: {
        claimedAt: new Date()
      }
    }),
    prisma.scout.update({
      where: {
        id: userId
      },
      data: {
        currentBalance: {
          increment: builderPoints + scoutPoints
        }
      }
    })
  ]);
}
