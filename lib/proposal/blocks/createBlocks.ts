import { prisma } from '@charmverse/core/prisma-client';

import { createBlock } from 'lib/proposal/blocks/createBlock';
import type { ProposalBlockInput, ProposalBlockWithTypedFields } from 'lib/proposal/blocks/interfaces';

export async function createBlocks({
  blocksData,
  userId,
  spaceId
}: {
  blocksData: ProposalBlockInput[];
  userId: string;
  spaceId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const promises = blocksData.map((data) => createBlock({ data, userId, spaceId, tx }));

    return Promise.all(promises) as Promise<ProposalBlockWithTypedFields[]>;
  });
}
