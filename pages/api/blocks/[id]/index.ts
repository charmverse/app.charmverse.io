
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<{deletedCount: number} | {error: string}>) {
  const allChildPageIds: string[] = [];
  const parentId = req.query.id as string;
  let childPageIds = [parentId];
  while (childPageIds.length !== 0) {
    allChildPageIds.push(...childPageIds);
    const childPages = (await prisma.page.findMany({
      where: {
        deletedAt: null,
        parentId: {
          in: childPageIds
        }
      },
      select: {
        id: true,
        type: true
      }
    }));

    childPageIds = [];
    for (const childPage of childPages) {
      const pagePermission = await computeUserPagePermissions({
        pageId: childPage.id,
        userId: req.session.user.id
      });

      if (pagePermission.delete || childPage.type === 'card') {
        childPageIds.push(childPage.id);
      }
    }
  }

  await prisma.page.updateMany({
    where: {
      id: {
        in: allChildPageIds
      }
    },
    data: {
      deletedAt: new Date()
    }
  });

  await prisma.block.updateMany({
    where: {
      OR: [
        {
          id: {
            in: allChildPageIds
          }
        },
        {
          parentId: {
            in: allChildPageIds
          }
        }
      ]
    },
    data: {
      deletedAt: new Date()
    }
  });

  return res.status(200).json({ deletedCount: allChildPageIds.length });
}

export default withSessionRoute(handler);
