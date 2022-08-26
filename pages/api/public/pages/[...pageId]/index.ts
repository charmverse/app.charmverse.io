import { Block, Page } from '@prisma/client';
import { prisma } from 'db';
import { Card } from 'lib/focalboard/card';
import { onError, onNoMatch } from 'lib/middleware';
import { NotFoundError } from 'lib/middleware/errors';
import { PublicPageResponse } from 'lib/pages';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { isUUID } from 'lib/utilities/strings';
import { PageContent } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPublicPage);

function recurse (node: PageContent, cb: (node: PageContent) => void) {
  if (node.content) {
    node.content.forEach(childNode => {
      recurse(childNode, cb);
    });
  }

  cb(node);
}

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

  const boardPages: Page[] = [];
  const boardBlocks: Block[] = [];
  const pageBlocks: Card[] = [];

  if (page.type === 'card' && page.parentId) {
    const boardPage = await prisma.page.findFirst({
      where: {
        deletedAt: null,
        id: page.parentId
      }
    });
    if (boardPage) {
      boardPages.push(boardPage);
    }

    const pageBlock = await prisma.block.findFirst({
      where: {
        deletedAt: null,
        id: page.id
      }
    }) as unknown as Card;

    if (pageBlock) {
      pageBlocks.push(pageBlock);
    }

    const boardBlock = await prisma.block.findFirst({
      where: {
        deletedAt: null,
        id: page.parentId
      }
    });

    if (boardBlock) {
      boardBlocks.push(boardBlock);
    }
  }
  else if (page.type === 'page') {
    const linkedPageIds: string[] = [];
    recurse(page.content as PageContent, (node) => {
      // Checking if all the mention attributes exist or not, and continue only if they exist
      if (node.type === 'inlineDatabase' && node.attrs) {
        // Some pageids are null
        if (node.attrs.pageId) {
          linkedPageIds.push(node.attrs.pageId);
        }
      }
    });

    const _boardBlocks = await prisma.block.findMany({
      where: {
        id: {
          in: linkedPageIds
        }
      }
    });

    _boardBlocks.forEach(boardBlock => boardBlocks.push(boardBlock));
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
    boardPages,
    pageBlocks,
    boardBlocks,
    space
  });
}

export default withSessionRoute(handler);
