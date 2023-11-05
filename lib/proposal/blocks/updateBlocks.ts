import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalBlockUpdateInput, ProposalBlockWithTypedFields } from 'lib/proposal/blocks/interfaces';
import { updateBlock } from 'lib/proposal/blocks/updateBlock';

export async function updateBlocks({
  blocksData,
  userId,
  spaceId
}: {
  blocksData: ProposalBlockUpdateInput[];
  userId: string;
  spaceId: string;
}) {
  return prisma.$transaction(blocksData.map((data) => updateBlock({ data, userId, spaceId }))) as Promise<
    ProposalBlockWithTypedFields[]
  >;
}
