import type { BuilderEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { rewardPoints } from '../constants';
import { currentSeason, getCurrentWeek } from '../dates';
import { BasicUserInfoSelect } from '../users/queries';

export async function updateReferralUsers(referralCode: string, refereeId: string) {
  const referrer = await prisma.scout.findUniqueOrThrow({
    where: {
      referralCode
    },
    select: {
      id: true
    }
  });

  const referrerId = referrer?.id;

  const eventType: BuilderEventType = 'referral';

  const users = await prisma.$transaction([
    // Update referrer
    prisma.scout.update({
      where: {
        id: referrerId
      },
      data: {
        currentBalance: {
          increment: rewardPoints
        },
        pointsReceived: {
          create: {
            value: rewardPoints,
            claimedAt: new Date(),
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
            },
            activities: {
              create: {
                type: 'points',
                userId: referrerId,
                recipientType: 'scout'
              }
            }
          }
        }
      },
      select: BasicUserInfoSelect
    }),
    // Update referee
    prisma.scout.update({
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
            event: {
              create: {
                season: currentSeason,
                type: eventType,
                description: `Received points for being referred`,
                week: getCurrentWeek(),
                builderId: refereeId
              }
            },
            activities: {
              create: {
                type: 'points',
                userId: refereeId,
                recipientType: 'scout'
              }
            }
          }
        }
      },
      select: BasicUserInfoSelect
    })
  ]);

  return users;
}
