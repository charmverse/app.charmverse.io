import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Block, Page } from '@prisma/client';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPublicPage);

async function getPublicPage (req: NextApiRequest, res: NextApiResponse<{pages: Page[], blocks: Block[]}>) {

  const { pageId } = req.query;

  if (pageId === undefined) {
    return res.status(400).json({ error: 'Please provide a valid page ID' } as any);
  }

  const pages: Page[] = [];
  const blocks: Block[] = [];
  const page = await prisma.page.findFirst({
    where: {
      deletedAt: null,
      id: pageId as string
    }
  });

  const computed = await computeUserPagePermissions({
    pageId: pageId as string
  });

  if (page === null || computed.read !== true) {
    return res.status(404).json({ error: 'Page not found' } as any);
  }

  pages.push(page);

  if (page.type === 'board') {
    // For publicly shared board page fetch all of its card pages
    const cardPages = await prisma.page.findMany({
      where: {
        deletedAt: null,
        parentId: page.id,
        type: 'card'
      }
    });

    pages.push(...cardPages);
  }
  else if (page.type === 'card' && page.parentId) {
    const boardPage = await prisma.page.findFirst({
      where: {
        deletedAt: null,
        id: page.parentId
      }
    });
    const cardBlock = await prisma.block.findFirst({
      where: {
        deletedAt: null,
        id: page.id
      }
    });

    const board = await prisma.block.findFirst({
      where: {
        deletedAt: null,
        id: page.parentId
      }
    });

    if (cardBlock && board) {
      blocks.push(cardBlock, board);
    }
    if (boardPage) {
      pages.push(boardPage);
    }
  }

  return res.status(200).json({
    pages,
    blocks
  });
}

export default withSessionRoute(handler);
