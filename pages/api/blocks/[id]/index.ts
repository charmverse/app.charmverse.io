
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<{deletedCount: number} | {error: string}>) {
  const parentId = req.query.id as string;
  let childIds = [parentId];
  const allChildIds: string[] = [];
  // For computing the permission we need the page ids separate from block ids
  const childPageIds: string[] = [];
  while (childIds.length !== 0) {
    allChildIds.push(...childIds);
    childIds = (await prisma.block.findMany({
      where: {
        OR: [
          {
            parentId: {
              in: childIds
            }
          },
          {
            rootId: {
              in: childIds
            }
          }
        ]
      },
      select: {
        id: true,
        type: true
      }
    })).map(childPage => childPage.id);

    const _childPageIds = (await prisma.page.findMany({
      where: {
        parentId: {
          in: childIds
        }
      },
      select: {
        id: true
      }
    })).map(childPage => childPage.id);

    childIds.push(..._childPageIds);
    childPageIds.push(..._childPageIds);
    childIds = Array.from(new Set(childIds));
  }

  // Making a record of all the child ids that can be potentially deleted
  const deletedChildPageRecord: Record<string, boolean> = allChildIds.reduce((cur, childId) => ({ ...cur, [childId]: true }), {});

  for (const childPageId of childPageIds) {
    const pagePermission = await computeUserPagePermissions({
      pageId: childPageId,
      userId: req.session.user.id
    });

    // If the child can't be deleted due to lack of permission, remove it from the record
    if (!pagePermission.delete) {
      delete deletedChildPageRecord[childPageId];
    }
  }

  const deletedChildPageIds = Object.keys(deletedChildPageRecord);

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

  return res.status(200).json({ deletedCount: deletedChildPageIds.length });
}

export default withSessionRoute(handler);
