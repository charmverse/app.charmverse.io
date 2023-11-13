import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { filterInternalProperties } from 'lib/focalboard/utilities';
import type {
  ProposalBlockUpdateInput,
  ProposalBlockWithTypedFields,
  ProposalPropertiesField,
  ProposalPropertyValues
} from 'lib/proposal/blocks/interfaces';
import { updateBlock } from 'lib/proposal/blocks/updateBlock';
import { updateProposal } from 'lib/proposal/updateProposal';

export async function updateBlocks({
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
        }
      })
    );

    await Promise.allSettled(promises);
  } catch (error) {
    log.error('Error updating proposal block fields', { error });
    throw error;
  }

  return prisma.$transaction(blocks.map((data) => updateBlock({ data, userId, spaceId }))) as Promise<
    ProposalBlockWithTypedFields[]
  >;
}
