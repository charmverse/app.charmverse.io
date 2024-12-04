import { prisma } from '@charmverse/core/prisma-client';
import { QuestsRecord } from '@packages/scoutgame-ui/components/quests/QuestsList/QuestsRecord';

import { sendPointsForSocialQuest } from '../points/builderEvents/sendPointsForSocialQuest';

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

  await sendPointsForSocialQuest({
    builderId: userId,
    points,
    type: questType
  });
}
