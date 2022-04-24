
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<Block | {error: string}>) {
  const blockId = req.query.id as string;
  const blockType = await prisma.block.findUnique({
    where: {
      id: blockId
    },
    select: {
      type: true
    }
  });

  async function _deleteBlock () {
    const deleted = await prisma.block.update({
      where: {
        id: blockId
      },
      data: {
        isAlive: false,
        deletedAt: new Date()
      }
    });
    await prisma.block.updateMany({
      where: {
        OR: [
          {
            rootId: blockId
          },
          {
            parentId: blockId
          }
        ]
      },
      data: {
        isAlive: false,
        deletedAt: new Date()
      }
    });

    return deleted;
  }

  if (blockType?.type === 'card') {
    // Check if the user has the permission to delete the card page
    const permissionSet = await computeUserPagePermissions({
      pageId: blockId,
      userId: req.session.user.id as string
    });

    if (!permissionSet.delete) {
      return res.status(401).json({
        error: 'You are not allowed to perform this action'
      });
    }
    else {
      await _deleteBlock();
    }
  }
  else {
    return res.status(200).json(await _deleteBlock());
  }
}

export default withSessionRoute(handler);
