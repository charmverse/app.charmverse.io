import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BlockWithDetails } from 'lib/databases/block';
import type { BoardFields } from 'lib/databases/board';
import { getRelatedBlocks } from 'lib/databases/getRelatedBlocks';
import { applyPropertiesToCards } from 'lib/databases/proposalsSource/applyPropertiesToCards';
import { createCards } from 'lib/databases/proposalsSource/createCards';
import { getCardPropertiesFromProposals } from 'lib/databases/proposalsSource/getCardProperties';
import { updateBoardProperties } from 'lib/databases/proposalsSource/updateBoardProperties';
import { onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { isTruthy } from 'lib/utils/types';
// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getBlockSubtree);

export const config = {
  api: {
    // silence errors about response size
    // https://nextjs.org/docs/messages/api-routes-response-size-limit
    responseLimit: false
  }
};

async function getBlockSubtree(req: NextApiRequest, res: NextApiResponse<BlockWithDetails[] | { error: string }>) {
  const pageId = req.query.id as string;
  const page = await prisma.page.findFirstOrThrow({
    where: {
      id: pageId
    },
    select: {
      boardId: true,
      cardId: true,
      spaceId: true
    }
  });

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session.user?.id
  });

  if (computed.read !== true) {
    return res.status(404).json({ error: 'page not found' });
  }

  const blockId = page.boardId || page.cardId;
  if (!blockId) {
    return res.status(404).json({ error: 'block not found' });
  }

  const { blocks } = await getRelatedBlocks(blockId);
  const block = blocks.find((b) => b.id === blockId);

  // Hydrate and filter blocks based on proposal permissions
  if (block && (block.fields as BoardFields).sourceType === 'proposals') {
    const result = await _getProposalSourceSubtree(block, blocks);
    return res.status(200).json(result);
  } else {
    const permissionsById = await permissionsApiClient.pages.bulkComputePagePermissions({
      pageIds: blocks.map((b) => b.pageId).filter(isTruthy),
      userId: req.session.user?.id
    });
    // Remmeber to allow normal blocks that do not have a page, like views, to be shown
    const filtered = blocks.filter((b) => typeof b.pageId === 'undefined' || !!permissionsById[b.pageId]?.read);
    return res.status(200).json(filtered);
  }
}

// retrieve blocks for databases using "proposal as a source"
async function _getProposalSourceSubtree(block: BlockWithDetails, blocks: BlockWithDetails[]) {
  // Update board and view blocks before computing proposal cards
  const updatedBoard = await updateBoardProperties({ boardId: block.id });
  // use the most recent the card properties
  block.fields = updatedBoard.fields as unknown as BoardFields;

  const [permissionsById, newCardBlocks, proposalCards] = await Promise.all([
    // get permissions for each propsoal based on the database author
    permissionsApiClient.proposals.bulkComputeProposalPermissions({
      spaceId: block.spaceId,
      userId: block.createdBy
    }),
    // create missing blocks for new proposals
    createCards({ boardId: block.id, spaceId: block.spaceId, createdBy: block.createdBy }),
    // get properties for proposals
    getCardPropertiesFromProposals({ cardProperties: block.fields.cardProperties, spaceId: block.spaceId })
  ]);
  // combine blocks with proposal cards and permissions
  const assembled = applyPropertiesToCards({
    blocks: blocks.concat(newCardBlocks),
    permissions: permissionsById,
    proposalCards
  });
  // Filter by permissions, but remember to allow normal blocks that do not have a page, like views, to be shown
  return assembled.filter((b) => typeof b.syncWithPageId === 'undefined' || !!permissionsById[b.syncWithPageId]?.view);
}

export default withSessionRoute(handler);
