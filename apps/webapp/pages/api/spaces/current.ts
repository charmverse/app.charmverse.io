import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getCurrentSpace);

async function getCurrentSpace(req: NextApiRequest, res: NextApiResponse<Space | null | { error: string }>) {
  const referer = req.headers.referer as string;
  const url = new URL(referer);
  url.hash = '';
  url.search = '';
  const pathnameParts = referer ? url.pathname.split('/') : [];
  const spaceDomain = pathnameParts[1];
  if (!spaceDomain) {
    return res.status(400).json({ error: 'spaceId is required' });
  }
  // publicly shared focalboard
  if (spaceDomain === 'share') {
    const pageId = pathnameParts[2];
    if (!pageId) {
      return res.status(400).json({ error: 'pageId is required' });
    }
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page?.spaceId) {
      return res.status(404).json({ error: 'page not found' });
    }
    const space = await prisma.space.findUnique({ where: { id: page.spaceId } });
    return res.status(200).json(space);
  }

  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });

  if (space) {
    return res.status(200).json(space);
  }
  return res.status(404).json({ error: 'no space found' });
}

export default withSessionRoute(handler);
