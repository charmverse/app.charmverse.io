import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, provisionSuperApiKey, requireKeys } from '@packages/lib/middleware';
import { requireSudoApiKey } from '@packages/lib/middleware/requireSudoApiKey';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSudoApiKey)
  .use(requireKeys(['name']))
  .post(provisionSuperToken)
  .delete(invalidateSuperToken);

async function provisionSuperToken(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body;

  const spaceToken = await provisionSuperApiKey(name);

  return res.status(200).json(spaceToken);
}

async function invalidateSuperToken(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query as { token: string };
  await prisma.superApiToken.delete({
    where: {
      token
    }
  });

  return res.status(200).send({
    success: true
  });
}

export default handler;
