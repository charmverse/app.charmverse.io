import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, provisionSuperApiKey, requireKeys } from 'lib/middleware';
import { requireSudoApiKey } from 'lib/middleware/requireSudoApiKey';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSudoApiKey)
  .use(requireKeys(['name'], 'body'))
  .post(provisionSuperToken)
  .delete(invalidateSuperToken);

async function provisionSuperToken(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body;

  const spaceToken = await provisionSuperApiKey(name);

  return res.status(200).json(spaceToken);
}

async function invalidateSuperToken(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.body;
  await prisma.superApiToken.delete({
    where: {
      token: token as string
    }
  });

  return res.status(200).send({
    success: true
  });
}

export default handler;
