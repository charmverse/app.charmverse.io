import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utils/types';

import type { BlockWithDetails } from '../block';

export async function createCards({
  boardId,
  spaceId
}: {
  boardId: string;
  spaceId: string;
}): Promise<BlockWithDetails[]> {
  const existingCards = await prisma.block.findMany({
    where: { parentId: boardId, type: 'card' },
    select: { page: { select: { syncWithPageId: true } } }
  });
  const pageIds = existingCards.map((card) => card.page?.syncWithPageId).filter(isTruthy);
  const orphanProposals = await prisma.proposal.findMany({ where: { spaceId, id: { notIn: pageIds } } });

  // create blocks for any missing proposals
  const blocks: BlockWithDetails[] = [];
  for (const proposal of orphanProposals) {
    const block = await createBlock(proposal);
    blocks.push(block);
  }

  return blocks;
}
