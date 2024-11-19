import { prisma } from '@charmverse/core/prisma-client';

import type { Season } from '../dates';
import { currentSeason } from '../dates';

import { getClaimablePoints } from './getClaimablePoints';

export async function claimPoints({ season = currentSeason, userId }: { season?: Season; userId: string }) {
  const { points, pointsReceiptIds } = await getClaimablePoints({ season, userId });

  await prisma.$transaction([
    prisma.pointsReceipt.updateMany({
      where: {
        id: {
          in: pointsReceiptIds
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
          increment: points
        }
      }
    })
  ]);
  return { total: points };
}
