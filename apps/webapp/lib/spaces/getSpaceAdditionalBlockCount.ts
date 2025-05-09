import type { BlockCount } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type BlockCountInfo = Pick<BlockCount, 'count' | 'details' | 'createdAt'>;

export async function getSpaceAdditionalBlockCount({ spaceId }: { spaceId: string }) {
  const additionalBlockCount = await prisma.additionalBlockQuota.aggregate({
    _sum: {
      blockCount: true
    },
    where: {
      spaceId,
      OR: [
        {
          expiresAt: null
        },
        {
          expiresAt: {
            gt: new Date()
          }
        }
      ]
    }
  });

  return additionalBlockCount._sum.blockCount ?? 0;
}
