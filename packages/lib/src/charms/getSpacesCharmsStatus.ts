import { prisma } from '@charmverse/core/prisma-client';
import { blocksPerCharm, defaultFreeBlockQuota } from '@packages/lib/subscription/constants';
import { getSpaceBlockCount } from '@packages/spaces/getSpaceBlockCount';

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
      }
    }
  });

  const spaceCharmsStatuses = await Promise.all(spaces.map(getSpaceStatus));

  return spaceCharmsStatuses;
}

async function getSpaceStatus(space: { id: string; charmWallet: { balance: number } | null }) {
  const blockCount = await getSpaceBlockCount({ spaceId: space.id });

  return {
    spaceId: space.id,
    balance: space.charmWallet?.balance || 0,
    balanceNeeded: countCharmsNeeded(blockCount.count || 0)
  };
}

function countCharmsNeeded(blockCount: number) {
  const missingBlocksCount = Math.max(blockCount - defaultFreeBlockQuota * 1000, 0);
  const neededCharms = Math.ceil(missingBlocksCount / blocksPerCharm);

  return neededCharms;
}
