import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BlockTypes } from 'lib/focalboard/block';
import { ApiError, ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { getPermissionsClient } from 'lib/permissions/api/routers';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBlock).delete(deleteBlock);
async function getBlock(req: NextApiRequest, res: NextApiResponse<Block>) {
  const blockId = req.query.id as string;

  const block = await prisma.block.findUniqueOrThrow({
    where: {
      id: blockId
    }
  });

  const pageId = block.type === 'view' ? block.rootId : block.id;

  const permissions = await getPermissionsClient({ resourceId: pageId, resourceIdType: 'page' }).then(({ client }) =>
    client.pages.computePagePermissions({ resourceId: pageId, userId: req.session.user?.id })
  );

  if (!permissions.read) {
    throw new DataNotFoundError('Block not found');
  }

  return res.status(200).json(block);
}

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

  const pageId = isPageBlock ? rootBlock.id : rootBlock.rootId;

  const permissionsSet = await getPermissionsClient({ resourceId: pageId, resourceIdType: 'page' }).then(({ client }) =>
    client.pages.computePagePermissions({
      resourceId: pageId,
      userId
    })
  );
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
