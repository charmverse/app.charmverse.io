import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder } from '@packages/scoutgame/testing/database';

import { completeQuest } from '../completeQuest';
import { QuestsRecord } from '../getQuests';

describe('completeQuest', () => {
  it('should throw an error if the quest is already completed', async () => {
    const builder = await mockBuilder();
    await completeQuest(builder.id, 'follow-x-account');
    await expect(completeQuest(builder.id, 'follow-x-account')).rejects.toThrow('Quest already completed');
  });

  it('should complete a quest', async () => {
    const builder = await mockBuilder();
    await completeQuest(builder.id, 'follow-x-account');

    const quest = await prisma.scoutSocialQuest.findFirstOrThrow({
      where: {
        userId: builder.id,
        type: 'follow-x-account'
      }
    });

    expect(quest).not.toBeNull();

    const points = await prisma.pointsReceipt.findMany({
      where: {
        recipientId: builder.id,
        event: {
          scoutSocialQuestId: quest.id,
          type: 'social_quest'
        }
      }
    });

    expect(points.length).toBe(1);
    expect(points[0].value).toBe(QuestsRecord['follow-x-account'].points);

    const scout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: builder.id
      },
      select: {
        currentBalance: true
      }
    });

    expect(scout.currentBalance).toBe(QuestsRecord['follow-x-account'].points);
  });
});
