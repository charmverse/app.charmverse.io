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

  const { pageId } = req.query;

  if (typeof pageId !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid page ID' } as any);
  }

  const query = isUUID(pageId)
    ? { deletedAt: null, id: pageId }
    : { deletedAt: null, path: pageId };

  const page = await prisma.page.findFirst({
    where: query
  });

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
