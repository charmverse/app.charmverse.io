import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';
import { IApiError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { User } from '@prisma/client';

async function getUserFromApiKey (req: NextApiRequest): Promise<User> {
  const apiKey = req.headers?.authorization?.split('Bearer').join('').trim() ?? req.query.api_key as string;

  console.log('Auth', req.headers.authorization);

  console.log('Api key', apiKey);

  // Protect against api keys or nullish API Keys
  if (!apiKey || apiKey.length < 1) {
    throw new Error('Api key not found');
  }

  const user = await prisma.user.findFirst({
    where: {
      token: apiKey
    }
  });

  if (!user) {
    throw new Error('Invalid API key');
  }

  return user;
}

/**
 * Generates a request handler that checks for target keys
 */
export async function requireApiKey (req: NextApiRequest, res: NextApiResponse, next: NextHandler) {

  try {
    await getUserFromApiKey(req);
  }
  catch (error) {
    console.log('Found error', error);
    return res.status(401).send({ error: 'Please provide a valid user' });
  }

  next();

}

export default requireApiKey;
