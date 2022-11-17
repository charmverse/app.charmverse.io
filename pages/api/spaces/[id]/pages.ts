
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { getPagePath } from 'lib/pages';
import type { IPageWithPermissions } from 'lib/pages/server';
import { includePagePermissionsMeta, getAccessiblePages } from 'lib/pages/server';
import { createPage } from 'lib/pages/server/createPage';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getPages);

async function getPages (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions[]>) {
  const spaceId = req.query.id as string;
  const archived = req.query.archived === 'true';
  const userId = req.session?.user?.id;
  const meta = req.query.meta === 'true';
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const accessiblePages = await getAccessiblePages({
    spaceId,
    userId,
    archived,
    meta,
    search
  });

  const createdPages: IPageWithPermissions[] = [];
  // const redirectUrl: null | string = null;

  if (accessiblePages.length === 0 && !search) {
    const totalPages = await prisma.page.count({
      where: {
        spaceId
      }
    });

    if (totalPages === 0) {
      const createdPage = await createPage({
        data: {
          type: 'page',
          title: '',
          createdBy: userId,
          updatedBy: userId,
          contentText: '',
          spaceId,
          path: getPagePath()
        },
        include: {
          ...includePagePermissionsMeta()
        }
      }) as IPageWithPermissions;

      await setupPermissionsAfterPageCreated(createdPage.id);
      createdPages.push(createdPage);
    }
    // else {
    //   const space = await prisma.space.findUnique({
    //     where: {
    //       id: spaceId
    //     },
    //     select: {
    //       domain: true
    //     }
    //   });
    //   if (space) {
    //     redirectUrl = `${req.headers.host}/${space.domain}/members`;
    //   }
    // }
  }

  // if (redirectUrl) {
  //   return res.writeHead(302, {
  //     Location: redirectUrl
  //   });
  // }
  return res.status(200).json([...accessiblePages, ...createdPages]);
}

export default withSessionRoute(handler);
