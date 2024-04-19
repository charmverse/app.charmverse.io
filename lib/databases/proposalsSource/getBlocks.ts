import { prisma } from '@charmverse/core/prisma-client';

import type { IssuableProposalCredentialSpace } from 'lib/credentials/findIssuableProposalCredentials';
import type { BlockWithDetails } from 'lib/databases/block';
import type { BoardFields } from 'lib/databases/board';
import { permissionsApiClient } from 'lib/permissions/api/client';

import { applyPropertiesToCardsAndFilter } from './applyPropertiesToCards';
import { createMissingCards } from './createMissingCards';
import { getCardPropertiesFromProposals } from './getCardProperties';
import { updateBoardProperties } from './updateBoardProperties';

// Retrieve blocks for databases using "proposal as a source" - populate properties and filter by permissions
export async function getBlocks(
  board: Pick<BlockWithDetails, 'fields' | 'spaceId' | 'createdBy'>,
  blocks: BlockWithDetails[]
) {
  const space: IssuableProposalCredentialSpace = await prisma.space.findUniqueOrThrow({
    where: {
      id: board.spaceId
    },
    select: {
      id: true,
      useOnchainCredentials: true,
      features: true,
      credentialTemplates: {
        where: {
          schemaType: 'proposal'
        }
      }
    }
  });

  const [permissionsById, proposalCardProperties] = await Promise.all([
    // get permissions for each propsoal based on the database author
    permissionsApiClient.proposals.bulkComputeProposalPermissions({
      spaceId: board.spaceId,
      userId: board.createdBy
    }),
    // get properties for proposals
    getCardPropertiesFromProposals({ cardProperties: board.fields.cardProperties, space })
  ]);
  // combine blocks with proposal cards and permissions
  return applyPropertiesToCardsAndFilter({
    boardProperties: board.fields.cardProperties,
    blocks,
    permissions: permissionsById,
    proposalCards: proposalCardProperties
  });
}

// Does the same as above but refreshes the board properties and creates missing cards
export async function getBlocksAndRefresh(board: BlockWithDetails, blocks: BlockWithDetails[]) {
  // Update board and view blocks before computing proposal cards
  const updatedBoard = await updateBoardProperties({ boardId: board.id });

  const space: IssuableProposalCredentialSpace = await prisma.space.findUniqueOrThrow({
    where: {
      id: board.spaceId
    },
    select: {
      id: true,
      useOnchainCredentials: true,
      features: true,
      credentialTemplates: {
        where: {
          schemaType: 'proposal'
        }
      }
    }
  });

  // use the most recent the card properties
  board.fields = updatedBoard.fields as unknown as BoardFields;

  const [permissionsById, newCardBlocks, proposalCardProperties] = await Promise.all([
    // get permissions for each propsoal based on the database author
    permissionsApiClient.proposals.bulkComputeProposalPermissions({
      spaceId: board.spaceId,
      userId: board.createdBy
    }),
    // create missing blocks for new proposals
    createMissingCards({ boardId: board.id }),
    // get properties for proposals
    getCardPropertiesFromProposals({ cardProperties: board.fields.cardProperties, space })
  ]);
  // combine blocks with proposal cards and permissions
  return applyPropertiesToCardsAndFilter({
    boardProperties: board.fields.cardProperties,
    blocks: blocks.concat(newCardBlocks),
    permissions: permissionsById,
    proposalCards: proposalCardProperties
  });
}
