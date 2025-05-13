import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalBlockWithTypedFields } from '@packages/lib/proposals/blocks/interfaces';

export async function getBlocks({
  spaceId,
  ids
}: {
  spaceId: string;
  ids?: string[];
}): Promise<ProposalBlockWithTypedFields[]> {
  const blocks = await prisma.proposalBlock.findMany({
    where: {
      spaceId,
      id:
        Array.isArray(ids) && ids.length
          ? {
              in: ids
            }
          : undefined
    }
  });

  return blocks as ProposalBlockWithTypedFields[];
}
