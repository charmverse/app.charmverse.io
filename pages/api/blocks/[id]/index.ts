
import type { Block } from '@prisma/client';
import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { withSessionRoute } from 'lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<{deletedCount: number, rootBlock: Block} | {error: string}>) {
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

  const isPageBlock = rootBlock.type === 'card' || rootBlock.type === 'card_template' || rootBlock.type === 'board';

  const permissionsSet = await computeUserPagePermissions({
    pageId: isPageBlock ? rootBlock.id : rootBlock.rootId,
    userId: req.session.user.id as string
  });

  if (!permissionsSet.delete) {
    return res.status(401).json({
      error: 'You are not allowed to perform this action'
    });
  }

  if (rootBlock.type === 'card' || rootBlock.type === 'card_template' || rootBlock.type === 'board') {

    const deletedChildPageIds = await modifyChildPages(blockId, userId, 'archive');
    deletedCount = deletedChildPageIds.length;
  }
  else if (rootBlock.type === 'view') {
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
  }
  else {
    await prisma.block.delete({
      where: {
        id: blockId
      }
    });
    deletedCount = 1;
  }

  return res.status(200).json({ deletedCount, rootBlock });
}

export default withSessionRoute(handler);
