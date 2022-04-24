
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requirePagePermissions } from 'lib/middleware/requirePagePermissions';
import { Page } from '@prisma/client';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['id'], 'query'))
  .use(requireUser)
  .put(updatePage)
  .delete(deletePage);

async function updatePage (req: NextApiRequest, res: NextApiResponse) {

  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  const updateContent = req.body as Page;

  if (updateContent.isPublic !== undefined && permissions.edit_isPublic !== true) {
    return res.status(401).json({
      error: 'You cannot update the public status of this page'
    });

  }
  else if (permissions.edit_content !== true) {
    return res.status(401).json({
      error: 'You cannot update this page'
    });
  }

  const pageWithPermission = await prisma.page.update({
    where: {
      id: pageId
    },
    data: req.body,
    include: {
      permissions: true
    }
  });

  return res.status(200).json(pageWithPermission);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse) {
  const allChildPageIds: string[] = [];
  const parentId = req.query.id as string;
  let childPageIds = [parentId];

  while (childPageIds.length !== 0) {
    allChildPageIds.push(...childPageIds);
    childPageIds = (await prisma.page.findMany({
      where: {
        parentId: {
          in: childPageIds
        }
      },
      select: {
        id: true
      }
    })).map(childPage => childPage.id);
  }

  // Making a record of all the child ids that can be potentially deleted
  const childPagesIdRecord: Record<string, boolean> = allChildPageIds.reduce((cur, childId) => ({ ...cur, [childId]: true }), {});
  for (const childPageId of allChildPageIds) {
    const pagePermission = await computeUserPagePermissions({
      pageId: childPageId,
      userId: req.session.user.id
    });

    // If the child can't be deleted due to lack of permission, remove it from the record
    if (!pagePermission.delete) {
      delete childPagesIdRecord[childPageId];
    }
  }

  const deletedChildPageIds = Object.keys(childPagesIdRecord);

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

  await prisma.block.updateMany({
    where: {
      OR: [
        {
          id: {
            in: deletedChildPageIds
          }
        },
        {
          parentId: {
            in: deletedChildPageIds
          }
        },
        {
          rootId: {
            in: deletedChildPageIds
          }
        }
      ]
    },
    data: {
      isAlive: false,
      deletedAt: new Date()
    }
  });

  return res.status(200).json({ deletedCount: deletedChildPageIds.length });
}

export default withSessionRoute(handler);
