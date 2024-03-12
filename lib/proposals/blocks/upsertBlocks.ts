import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { filterInternalProperties } from 'lib/focalboard/utilities';
import type {
  ProposalBlockUpdateInput,
  ProposalBlockWithTypedFields,
  ProposalPropertiesField,
  ProposalPropertyValues
} from 'lib/proposals/blocks/interfaces';
import { upsertBlock } from 'lib/proposals/blocks/upsertBlock';
import { updateProposal } from 'lib/proposals/updateProposal';

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
