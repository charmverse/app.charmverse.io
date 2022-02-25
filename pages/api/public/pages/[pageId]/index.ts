
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPublicPage);

async function getPublicPage (req: NextApiRequest, res: NextApiResponse<Page>) {

  const { pageId } = req.query;

  if (pageId === undefined) {
    return res.status(400).json({ error: 'Please provide a valid page ID' } as any);
  }

  const page = await prisma.page.findUnique({
    where: {
      id: pageId as string
    }
  });

  if (page === null || page.isPublic !== true) {
    return res.status(404).json({ error: 'Page not found' } as any);
  }

  return res.status(200).json(page);
}

export default withSessionRoute(handler);
