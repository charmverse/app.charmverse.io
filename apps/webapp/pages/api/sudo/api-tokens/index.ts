import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, provisionApiKey, requireKeys } from '@packages/lib/middleware';
import { requireSudoApiKey } from '@packages/lib/middleware/requireSudoApiKey';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSudoApiKey)
  .use(requireKeys(['spaceId']))
  .post(provisionToken)
  .delete(invalidateToken);

async function provisionToken(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.body;

  const spaceToken = await provisionApiKey(spaceId);

  return res.status(200).json(spaceToken);
}

async function invalidateToken(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.query as { spaceId: string };
  await prisma.spaceApiToken.delete({
    where: {
      spaceId
    }
  });

  return res.status(200).send({
    success: true
  });
}

export default handler;
