import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalBlockUpdateInput } from 'lib/proposal/blocks/interfaces';
import { updateBlock } from 'lib/proposal/blocks/updateBlock';

export async function updateBlocks({ blocksData, userId }: { blocksData: ProposalBlockUpdateInput[]; userId: string }) {
  return prisma.$transaction(blocksData.map((data) => updateBlock({ data, userId })));
}
