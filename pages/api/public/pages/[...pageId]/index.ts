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

  const pageId = typeof req.query.pageId === 'string' && req.query.pageId;

  let page: Page | null = null;

  if (pageId) {
    if (isUUID(pageId)) {
      page = await prisma.page.findFirst({ where: { deletedAt: null, id: pageId } });
    }
    return res.status(400).json({ error: 'Please provide a valid page ID' } as any);
  }
  else if (req.query.pageId instanceof Array) {
    const spaceDomain = req.query.pageId[0];
    const pagePath = req.query.pageId[1];
    if (spaceDomain && pagePath) {
      const space = await prisma.space.findUnique({ where: { domain: spaceDomain } });
      if (space) {
        page = await prisma.page.findFirst({
          where: {
            deletedAt: null,
            spaceId: space.id,
            path: pagePath
          }
        });
      }
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
