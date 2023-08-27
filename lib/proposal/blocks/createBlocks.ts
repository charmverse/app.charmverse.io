import { prisma } from '@charmverse/core/prisma-client';

import { createBlock } from 'lib/proposal/blocks/createBlock';
import type { ProposalBlockInput, ProposalBlockWithTypedFields } from 'lib/proposal/blocks/interfaces';

export async function createBlocks({ blocksData, userId }: { blocksData: ProposalBlockInput[]; userId: string }) {
  return prisma.$transaction(async (tx) => {
    const promises = blocksData.map((data) => createBlock({ data, userId, tx }));

    return Promise.all(promises) as Promise<ProposalBlockWithTypedFields[]>;
  });
}
