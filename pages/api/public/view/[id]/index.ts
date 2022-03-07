
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Block, Page } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPageByBlockViewId);

async function getPageByBlockViewId (req: NextApiRequest, res: NextApiResponse<Page>) {

  const { id } = req.query;

  const view = await prisma.block.findFirst({
    where: {
      id: id as string,
      type: 'view'
    }
  });

  if (!view) {
    return res.status(400).json({ error: 'No such view exists' } as any);
  }

  const page = await prisma.page.findFirst({
    where: {
      boardId: view.rootId,
      isPublic: true
    }
  });

  if (!page) {
    return res.status(400).json({ error: 'No such page exists' } as any);
  }

  return res.status(200).json(page);
}

export default withSessionRoute(handler);
