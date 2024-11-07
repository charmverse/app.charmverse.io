import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';
import { incrementPointsEarnedStats } from '@packages/scoutgame/points/updatePointsEarned';

import { QuestsRecord } from './getQuests';

export async function completeQuest(userId: string, questType: string) {
  const points = QuestsRecord[questType].points;

  await prisma.$transaction(async (tx) => {
    const quest = await tx.scoutSocialQuest.findFirst({
      where: {
        type: questType,
        userId
      }
    });

    if (quest) {
      throw new Error('Quest already completed');
    }

    await tx.scoutSocialQuest.create({
      data: {
        type: questType,
        userId
      }
    });

    await tx.pointsReceipt.create({
      data: {
        recipient: {
          connect: {
            id: userId
          }
        },
        claimedAt: new Date(),
        value: points,
        event: {
          create: {
            type: 'social_quest',
            week: getCurrentWeek(),
            season: currentSeason,
            builder: {
              connect: {
                id: userId
              }
            }
          }
        }
      }
    });

    await incrementPointsEarnedStats({
      userId,
      season: currentSeason,
      builderPoints: points,
      tx
    });
  });
}
