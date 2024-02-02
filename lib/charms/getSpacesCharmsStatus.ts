import { prisma } from '@charmverse/core/prisma-client';

import { blocksPerCharm, defaultFreeBlockQuota } from 'lib/subscription/constants';

export type SpaceCharmsStatus = {
  spaceId: string;
  balance: number;
  balanceNeeded: number;
};

export async function getSpacesCharmsStatus(userId: string) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true
    }
  });

  const spaces = await prisma.space.findMany({
    where: { id: { in: spaceRoles.map(({ spaceId }) => spaceId) } },
    select: {
      id: true,
      charmWallet: {
        select: {
          balance: true
        }
      },
      blockCounts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          count: true
        }
      }
    }
  });

  const spaceCharmsStatuses: SpaceCharmsStatus[] = spaces.map((space) => ({
    spaceId: space.id,
    balance: space.charmWallet?.balance || 0,
    balanceNeeded: countCharmsNeeded(space.blockCounts[0].count)
  }));

  return spaceCharmsStatuses;
}

function countCharmsNeeded(blockCount: number) {
  const missingBlocksCount = Math.max(blockCount - defaultFreeBlockQuota * 1000, 0);
  const neededCharms = Math.ceil(missingBlocksCount / blocksPerCharm);

  return neededCharms;
}
