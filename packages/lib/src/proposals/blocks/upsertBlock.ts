import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getUpsertBlockInput } from '@packages/databases/customBlocks/getUpsertBlockInput';
import type { ProposalBlockInput, ProposalBlockUpdateInput } from '@packages/lib/proposals/blocks/interfaces';

export function upsertBlock({
  data,
  userId,
  spaceId,
  tx = prisma
}: {
  data: ProposalBlockUpdateInput | ProposalBlockInput;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
}) {
  const input = getUpsertBlockInput({ data, userId, spaceId });

  return tx.proposalBlock.upsert(input);
}
