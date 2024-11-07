import { prisma } from '@charmverse/core/prisma-client';
import { sendPoints } from '@packages/scoutgame/points/sendPoints';

import { QuestsRecord } from './getQuests';

export async function completeQuest(userId: string, questType: string) {
  const points = QuestsRecord[questType].points;
  const quest = await prisma.scoutSocialQuest.findFirst({
    where: {
      type: questType,
      userId
    }
  });

  if (quest) {
    throw new Error('Quest already completed');
  }

  await prisma.$transaction(async (tx) => {
    await tx.scoutSocialQuest.create({
      data: {
        type: questType,
        userId
      }
    });

    await sendPoints({
      builderId: userId,
      eventType: 'social_quest',
      points,
      claimed: true,
      earnedAs: 'builder',
      tx
    });
  });
}
