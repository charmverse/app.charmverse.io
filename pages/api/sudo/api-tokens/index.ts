
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, provisionApiKey, requireKeys } from 'lib/middleware';

function requireSudoKey (req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const { sudoApiKey } = req.query;

  const currentSudoKey = process.env.SUDO_API_KEY;

  if (!currentSudoKey || !sudoApiKey || currentSudoKey.trim() !== (sudoApiKey as string).trim()) {
    return res.status(401).send({
      error: 'Please provide a valid API Key'
    });
  }

  next();
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSudoKey)
  .use(requireKeys(['spaceId'], 'body'))
  .post(provisionToken)
  .delete(invalidateToken);

async function provisionToken (req: NextApiRequest, res: NextApiResponse) {

  const { spaceId } = req.body;

  const spaceToken = await provisionApiKey(spaceId);

  return res.status(200).json(spaceToken);

}

async function invalidateToken (req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.body;
  await prisma.spaceApiToken.delete({
    where: {
      spaceId: spaceId as string
    }
  });

  return res.status(200).send({
    success: true
  });

}

export default handler;
