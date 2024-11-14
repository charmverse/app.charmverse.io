import { prisma } from '@charmverse/core/prisma-client';

import { BasicUserInfoSelect } from '../users/queries';

export async function findScoutOrThrow(scoutId: string) {
  return prisma.scout.findUniqueOrThrow({
    where: {
      id: scoutId
    },
    select: {
      ...BasicUserInfoSelect,
      farcasterName: true
    }
  });
}