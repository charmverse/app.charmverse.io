import { Space } from '@prisma/client';
import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';

async function getSpaceFromApiKey (req: NextApiRequest): Promise<Space> {
  const apiKey = req.headers?.authorization?.split('Bearer').join('').trim() ?? req.query.api_key as string;

  // Protect against api keys or nullish API Keys
  if (!apiKey || apiKey.length < 1) {
    throw new Error('Api key not found');
  }

  const spaceToken = await prisma.spaceToken.findFirst({
    where: {
      token: apiKey
    },
    include: {
      space: true
    }
  });

  if (!spaceToken) {
    throw new Error('Invalid API key');
  }

  return spaceToken.space;
}

/**
 * Check for a valid space level API token, and ensure the operation is taking place only in the target space
 */
export async function requireApiKey (req: NextApiRequest, res: NextApiResponse, next: NextHandler) {

  try {
    const space = await getSpaceFromApiKey(req);

    const querySpaceId = req.query.spaceId;

    if (querySpaceId && querySpaceId !== space.id) {
      return res.status(401).send({
        error: 'API Token does not have access to this space'
      });
    }

    const bodySpaceId = req.body.spaceId;

    if (bodySpaceId && bodySpaceId !== space.id) {
      return res.status(401).send({
        error: 'API Token does not have access to this space'
      });
    }

  }
  catch (error) {
    console.log('Found error', error);
    return res.status(401).send({ error: 'Please provide a valid user' });
  }

  next();

}

export default requireApiKey;
