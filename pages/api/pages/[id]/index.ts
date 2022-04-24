
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
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
    const _childPageIds = (await prisma.page.findMany({
      where: {
        deletedAt: null,
        parentId: {
          in: childPageIds
        }
      },
      select: {
        id: true
      }
    })).map(childPage => childPage.id);

    childPageIds = [];
    for (const _childPageId of _childPageIds) {
      const pagePermission = await computeUserPagePermissions({
        pageId: _childPageId,
        userId: req.session.user.id
      });

      if (pagePermission.delete) {
        childPageIds.push(_childPageId);
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
