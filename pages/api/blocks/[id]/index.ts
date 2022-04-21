
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requirePagePermissions } from 'lib/middleware/requirePagePermissions';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<Block>) {
  const blockType = await prisma.block.findUnique({
    where: {
      id: req.query.id as string
    },
    select: {
      type: true
    }
  });

  async function _deleteBlock () {
    const deleted = await prisma.block.delete({
      where: {
        id: req.query.id as string
      }
    });

    await prisma.block.deleteMany({
      where: {
        OR: [
          {
            rootId: req.query.id as string
          },
          {
            parentId: req.query.id as string
          }
        ]
      }
    });

    return deleted;
  }

  if (blockType?.type === 'card') {
    requirePagePermissions(['delete'], async () => {
      return res.status(200).json(await _deleteBlock());
    })(req, res);
  }
  else {
    return res.status(200).json(await _deleteBlock());
  }
}

export default withSessionRoute(handler);
