import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Block, Page, Space } from '@prisma/client';
import { prisma } from 'db';
import { isUUID } from 'lib/utilities/strings';
import { NotFoundError } from 'lib/middleware/errors';
import { computeUserPagePermissions } from 'lib/permissions/pages';

export interface PublicPageResponse {
  page: Page;
  boardPage: Page | null;
  pageBlock: Block | null;
  boardBlock: Block | null;
  space: Space;
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPublicPage);

async function getPublicPage (req: NextApiRequest, res: NextApiResponse<PublicPageResponse>) {

  const { pageId: pageIdOrPath } = req.query as {pageId: string[]};

  const isPageId = typeof pageIdOrPath[0] === 'string' && isUUID(pageIdOrPath[0]);

  let page: Page | null = null;

  if (isPageId) {
    page = await prisma.page.findFirst({ where: { deletedAt: null, id: pageIdOrPath[0] } });
  }
  // Tuple array of path segments [spaceDomain, pagePath]

  const [spaceDomain, pagePath] = pageIdOrPath;

  if (spaceDomain && pagePath) {
    const space = await prisma.space.findUnique({ where: { domain: spaceDomain } });
    if (space) {
      page = await prisma.page.findFirst({
        where: {
          deletedAt: null,
          space: {
            domain: spaceDomain
          },
          path: pagePath.trim()
        }
      });
    }
  }

  if (!page) {
    throw new NotFoundError('Page not found');
  }

  const computed = await computeUserPagePermissions({
    pageId: page.id
  });

  if (computed.read !== true) {
    throw new NotFoundError('Page not found');
  }

  let boardPage: Page | null = null;
  let boardBlock: Block | null = null;
  let pageBlock: Block | null = null;

  if (page.type === 'card' && page.parentId) {
    boardPage = await prisma.page.findFirst({
      where: {
        deletedAt: null,
        id: page.parentId
      }
    });
    pageBlock = await prisma.block.findFirst({
      where: {
        deletedAt: null,
        id: page.id
      }
    });

    boardBlock = await prisma.block.findFirst({
      where: {
        deletedAt: null,
        id: page.parentId
      }
    });
  }

  const space = await prisma.space.findFirst({
    where: {
      id: page.spaceId!
    }
  });

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  return res.status(200).json({
    page,
    boardPage,
    pageBlock,
    boardBlock,
    space
  });
}

export default withSessionRoute(handler);
