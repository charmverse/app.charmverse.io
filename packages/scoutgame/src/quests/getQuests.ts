import type { ScoutSocialQuest } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function getQuests(userId: string): Promise<ScoutSocialQuest[]> {
  const socialQuests = await prisma.scoutSocialQuest.findMany({
    where: {
      userId
    }
  });

  return socialQuests;
}
