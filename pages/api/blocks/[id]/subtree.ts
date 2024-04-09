import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BlockWithDetails } from 'lib/databases/block';
import type { BoardFields } from 'lib/databases/board';
import { getRelatedBlocks } from 'lib/databases/getRelatedBlocks';
import { applySourceToDatabase } from 'lib/databases/proposalsSource/applySourceToDatabase';
import { assembleBlocks } from 'lib/databases/proposalsSource/assembleBlocks';
import { createCards } from 'lib/databases/proposalsSource/createCards';
import { getCardsFromProposals } from 'lib/databases/proposalsSource/getCardsFromProposals';
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
    // Update board and view blocks before computing proposal cards
    await applySourceToDatabase({ boardId: pageId, spaceId: page.spaceId });

    const [permissionsById, newCardBlocks, proposalCards] = await Promise.all([
      // get permissions for each propsoal
      permissionsApiClient.proposals.bulkComputeProposalPermissions({
        spaceId: page.spaceId,
        userId: req.session.user?.id
      }),
      // create missing blocks for new proposals
      createCards({ boardId: blockId, spaceId: page.spaceId, createdBy: block.createdBy }),
      // get properties for proposals
      getCardsFromProposals({ cardProperties: block.fields.cardProperties, spaceId: page.spaceId })
    ]);
    // combine blocks with proposal cards and permissions
    const result = assembleBlocks({
      blocks: blocks.concat(newCardBlocks),
      permissions: permissionsById,
      proposalCards
    });
    // Filter by permissions, but remember to allow normal blocks that do not have a page, like views, to be shown
    const filtered = result.filter(
      (b) => typeof b.syncWithPageId === 'undefined' || !!permissionsById[b.syncWithPageId]?.view
    );
    return res.status(200).json(filtered);
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

export default withSessionRoute(handler);
