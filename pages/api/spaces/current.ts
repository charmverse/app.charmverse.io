
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Space } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getCurrentSpace);

async function getCurrentSpace (req: NextApiRequest, res: NextApiResponse<Space | null | { error: string }>) {
  const referer = req.headers.referer as string;
  const spaceDomain = referer ? new URL(referer).pathname.split('/')[1] : null;
  if (!spaceDomain) {
    return res.status(400).json({ error: 'spaceId is required' });
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
