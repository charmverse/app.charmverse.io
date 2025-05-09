import { prisma } from '@charmverse/core/prisma-client';
import { BoardView } from '@packages/databases/boardView';
import { DEFAULT_VIEW_BLOCK_ID, PROPOSAL_STATUS_BLOCK_ID } from '@packages/lib/proposals/blocks/constants';
import { v4 } from 'uuid';

async function addDefaultProposalViewFilter() {
  // Get all structured proposal templates
  const proposalBlocks = await prisma.proposalBlock.findMany({
    where: {
      id: DEFAULT_VIEW_BLOCK_ID
    },
    select: {
      spaceId: true,
      fields: true,
      id: true
    }
  });

  for (const proposalBlock of proposalBlocks) {
    const proposalBlockFields = (proposalBlock as BoardView).fields;
    const hasArchivedFilter = proposalBlockFields.filter?.filters?.some(
      (filterClauseOrGroup) =>
        'propertyId' in filterClauseOrGroup &&
        filterClauseOrGroup.propertyId === PROPOSAL_STATUS_BLOCK_ID &&
        filterClauseOrGroup.values?.includes('archived')
    );

    if (!hasArchivedFilter) {
      await prisma.proposalBlock.update({
        where: {
          id_spaceId: {
            id: DEFAULT_VIEW_BLOCK_ID,
            spaceId: proposalBlock.spaceId
          }
        },
        data: {
          fields: {
            ...proposalBlockFields,
            filter: {
              ...(proposalBlockFields.filter ?? {}),
              filters: [
                ...(proposalBlockFields.filter?.filters ?? []),
                {
                  condition: 'does_not_contain',
                  filterId: v4(),
                  operation: 'and',
                  propertyId: PROPOSAL_STATUS_BLOCK_ID,
                  values: ['archived']
                }
              ]
            }
          }
        }
      });
    }
  }
}

addDefaultProposalViewFilter();
