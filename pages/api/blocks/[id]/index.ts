import type { Block } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { BlockTypes } from 'lib/focalboard/block';
import log from 'lib/log';
import { ApiError, ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock(
  req: NextApiRequest,
  res: NextApiResponse<{ deletedCount: number; rootBlock: Block } | { error: string }>
) {
  const blockId = req.query.id as string;
  const userId = req.session.user.id as string;

  let deletedCount = 0;

  const rootBlock = await prisma.block.findUnique({
    where: {
      id: blockId
    }
  });

  if (!rootBlock) {
    throw new ApiError({
      message: 'Block not found',
      errorType: 'Data not found'
    });
  }

  const spaceId = rootBlock.spaceId;

  const isPageBlock = rootBlock.type === 'card' || rootBlock.type === 'card_template' || rootBlock.type === 'board';

  const permissionsSet = await computeUserPagePermissions({
    pageId: isPageBlock ? rootBlock.id : rootBlock.rootId,
    userId: req.session.user.id as string
  });

  if (rootBlock.type === 'card' || rootBlock.type === 'card_template' || rootBlock.type === 'board') {
    if (!permissionsSet.delete) {
      throw new ActionNotPermittedError();
    }

    const deletedChildPageIds = await modifyChildPages(blockId, userId, 'archive');
    deletedCount = deletedChildPageIds.length;
    relay.broadcast(
      {
        type: 'blocks_deleted',
        payload: deletedChildPageIds.map((id) => ({ id, type: 'card' }))
      },
      spaceId
    );

    relay.broadcast(
      {
        type: 'pages_deleted',
        payload: deletedChildPageIds.map((id) => ({ id }))
      },
      spaceId
    );

    log.info('User deleted a page block', {
      userId,
      pageId: blockId,
      pageIds: deletedChildPageIds,
      spaceId: rootBlock.spaceId
    });
  } else if (rootBlock.type === 'view') {
    if (!permissionsSet.edit_content) {
      throw new ActionNotPermittedError();
    }

    const viewsCount = await prisma.block.count({
      where: {
        type: 'view',
        parentId: rootBlock.parentId
      }
    });

    if (viewsCount === 1) {
      throw new ApiError({
        message: "Last view of a board page can't be deleted",
        errorType: 'Undesirable operation'
      });
    }

    await prisma.block.delete({
      where: {
        id: blockId
      }
    });
    deletedCount = 1;

    relay.broadcast(
      {
        type: 'blocks_deleted',
        payload: [{ id: blockId, type: rootBlock.type }]
      },
      spaceId
    );
  } else {
    if (!permissionsSet.edit_content) {
      throw new ActionNotPermittedError();
    }

    await prisma.block.delete({
      where: {
        id: blockId
      }
    });
    deletedCount = 1;

    relay.broadcast(
      {
        type: 'blocks_deleted',
        payload: [{ id: blockId, type: rootBlock.type as BlockTypes }]
      },
      spaceId
    );
  }

  return res.status(200).json({ deletedCount, rootBlock });
}

export default withSessionRoute(handler);
