
import { Transaction, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc, { NextHandler } from 'next-connect';
import crypto from 'node:crypto';

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

  const newApiKey = crypto.randomBytes(160 / 8).toString('hex');

  console.log('Space ID ==>', spaceId);

  const spaceToken = await prisma.spaceToken.upsert({
    where: {
      spaceId: spaceId as string
    },
    update: {
      token: newApiKey
    },
    create: {
      token: newApiKey,
      space: {
        connect: {
          id: spaceId
        }
      }
    }
  });

  return res.status(200).json(spaceToken);
}

async function invalidateToken (req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.body;
  await prisma.spaceToken.delete({
    where: {
      spaceId: spaceId as string
    }
  });

  return res.status(200).send({
    success: true
  });

}

export default withSessionRoute(handler);
