
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser, ApiError } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { deleteNestedChild } from 'lib/pages/deleteNestedChild';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { Block } from '@prisma/client';
import { prisma } from 'db';

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

  if (rootBlock.type === 'card' || rootBlock.type === 'board') {
    const permissionsSet = await computeUserPagePermissions({
      pageId: req.query.id as string,
      userId: req.session.user.id as string
    });

    if (!permissionsSet.delete) {
      return res.status(401).json({
        error: 'You are not allowed to perform this action'
      });
    }

    const deletedChildPageIds = await deleteNestedChild(blockId, userId);
    deletedCount = deletedChildPageIds.length;
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
