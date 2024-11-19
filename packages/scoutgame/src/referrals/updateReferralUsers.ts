import type { BuilderEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { rewardPoints } from '../constants';
import { currentSeason, getCurrentWeek } from '../dates';
import { BasicUserInfoSelect } from '../users/queries';

export async function updateReferralUsers(referralCode: string, refereeId: string) {
  const initialReferrer = await prisma.scout.findUniqueOrThrow({
    where: {
      referralCode
    },
    select: {
      id: true
    }
  });

  const referrerId = initialReferrer?.id;

  const eventType: BuilderEventType = 'referral';

  const txs = await prisma.$transaction(async (tx) => {
    // Update referrer
    const referrer = await tx.scout.update({
      where: {
        id: referrerId
      },
      data: {
        currentBalance: {
          increment: rewardPoints
        }
      },
      select: BasicUserInfoSelect
    });

    const referrerPointsReceived = await tx.pointsReceipt.create({
      data: {
        value: rewardPoints,
        claimedAt: new Date(),
        recipient: {
          connect: {
            id: referrerId
          }
        },
        event: {
          create: {
            season: currentSeason,
            type: eventType,
            description: `Received points for being a referrer`,
            week: getCurrentWeek(),
            builderId: referrerId,
            referralCodeEvent: {
              create: {
                refereeId
              }
            }
          }
        }
      }
    });

    // Update referee
    const referee = await tx.scout.update({
      where: {
        id: refereeId
      },
      data: {
        currentBalance: {
          increment: rewardPoints
        },
        pointsReceived: {
          create: {
            value: rewardPoints,
            claimedAt: new Date(),
            eventId: referrerPointsReceived.eventId
          }
        }
      },
      select: BasicUserInfoSelect
    });

    return [referrer, referee];
  });

  return txs;
}
