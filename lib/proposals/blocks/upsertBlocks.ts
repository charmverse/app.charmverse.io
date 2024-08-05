import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { filterInternalProperties } from '@root/lib/databases/utilities';
import type {
  ProposalBlockUpdateInput,
  ProposalBlockWithTypedFields,
  ProposalPropertiesField,
  ProposalPropertyValues
} from '@root/lib/proposals/blocks/interfaces';
import { upsertBlock } from '@root/lib/proposals/blocks/upsertBlock';
import { updateProposal } from '@root/lib/proposals/updateProposal';

export async function upsertBlocks({
  blocksData,
  userId,
  spaceId
}: {
  blocksData: ProposalBlockUpdateInput[];
  userId: string;
  spaceId: string;
}) {
  const blocks = blocksData.filter((block) => block.type !== 'card');
  const proposals = blocksData.filter((block) => block.type === 'card');

  try {
    const promises = proposals.map((proposal) =>
      updateProposal({
        proposalId: proposal.id,
        fields: {
          ...proposal.fields,
          properties: filterInternalProperties<ProposalPropertiesField>(
            (proposal.fields as ProposalPropertyValues).properties
          )
        },
        actorId: userId
      })
    );

    await Promise.allSettled(promises);
  } catch (error) {
    log.error('Error updating proposal block fields', { error });
    throw error;
  }

  return prisma.$transaction(blocks.map((data) => upsertBlock({ data, userId, spaceId }))) as Promise<
    ProposalBlockWithTypedFields[]
  >;
}
