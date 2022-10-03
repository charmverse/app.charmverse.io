
import { Prisma, Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

export interface Response {
  ok: boolean;
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(checkDomain);

async function checkDomain (req: NextApiRequest, res: NextApiResponse<Response>) {
  const spaceId = req.query.spaceId as string | undefined;
  const space = await prisma.space.findFirst({
    where: { domain: req.query.domain as string, id: spaceId }
  });
  if (space && space.id !== spaceId) {
    return res.status(200).json({ ok: true });
  }
  else {
    return res.status(200).json({ ok: false });
  }
}

export default withSessionRoute(handler);
