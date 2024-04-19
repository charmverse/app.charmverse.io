import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BlockWithDetails } from 'lib/databases/block';
import type { BoardFields } from 'lib/databases/board';
import { getRelatedBlocks } from 'lib/databases/getRelatedBlocks';
import { getBlocksAndRefresh } from 'lib/databases/proposalsSource/getBlocks';
import { onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utils/errors';
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
    throw new DataNotFoundError('Page not found');
  }

  const blockId = page.boardId || page.cardId;
  if (!blockId) {
    throw new DataNotFoundError('Block not found');
  }

  const { blocks } = await getRelatedBlocks(blockId);
  const block = blocks.find((b) => b.id === blockId);

  if (block && (block.fields as BoardFields).sourceType === 'proposals') {
    // Hydrate and filter blocks based on proposal permissions
    const result = await getBlocksAndRefresh(block, blocks);
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

export default withSessionRoute(handler);
