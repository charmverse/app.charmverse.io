
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<Block | {error: string}>) {
  const parentId = req.query.id as string;
  let childPageIds = [parentId];
  const deletedChildPageIds: string[] = [];

  while (childPageIds.length !== 0) {
    deletedChildPageIds.push(...childPageIds);
    childPageIds = (await prisma.block.findMany({
      where: {
        OR: [
          {
            parentId: {
              in: childPageIds
            }
          },
          {
            rootId: {
              in: childPageIds
            }
          }
        ]
      },
      select: {
        id: true
      }
    })).map(childPage => childPage.id);

    childPageIds.push(...(await prisma.page.findMany({
      where: {
        parentId: {
          in: childPageIds
        }
      },
      select: {
        id: true
      }
    })).map(childPage => childPage.id));

    childPageIds = Array.from(new Set(childPageIds));
  }

  const deleted = await prisma.block.update({
    where: {
      id: parentId
    },
    data: {
      isAlive: false,
      deletedAt: new Date()
    }
  });

  await prisma.block.updateMany({
    where: {
      id: {
        in: deletedChildPageIds
      }
    },
    data: {
      isAlive: false,
      deletedAt: new Date()
    }
  });

  await prisma.page.updateMany({
    where: {
      id: {
        in: deletedChildPageIds
      }
    },
    data: {
      isAlive: false,
      deletedAt: new Date()
    }
  });

  // if (blockType?.type === 'card') {
  //   // Check if the user has the permission to delete the card page
  //   const permissionSet = await computeUserPagePermissions({
  //     pageId: blockId,
  //     userId: req.session.user.id as string
  //   });

  //   if (!permissionSet.delete) {
  //     return res.status(401).json({
  //       error: 'You are not allowed to perform this action'
  //     });
  //   }
  //   else {
  //   }
  // }
  // else {
  // }
  return res.status(200).json(deleted);
}

export default withSessionRoute(handler);
