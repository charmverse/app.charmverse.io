import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { sendPointsForSocialQuest } from '../points/builderEvents/sendPointsForSocialQuest';

import type { QuestType } from './questRecords';
import { questsRecord } from './questRecords';

export async function completeQuest(userId: string, questType: QuestType) {
  const points = questsRecord[questType].points;
  const quest = await prisma.scoutSocialQuest.findFirst({
    where: {
      type: questType,
      userId
    }
  });

  if (quest) {
    throw new Error('Quest already completed');
  }

  await sendPointsForSocialQuest({
    builderId: userId,
    points,
    type: questType
  });

  trackUserAction('complete_quest', { userId, questType });
}
