import { Space, User } from '@prisma/client';
import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';

declare module 'http' {
  interface IncomingMessage {
    authorizedSpaceId: string
    botUser: User
  }
}

/**
 * Returns bot user for the space, and creates one if they do not exist
 */
export async function getBotUser (spaceId: string): Promise<User> {
  let botUser = await prisma.user.findFirst({
    where: {
      isBot: true,
      spaceRoles: {
        some: {
          spaceId
        }
      }
    }
  });

  if (!botUser) {
    botUser = await prisma.user.create({
      data: {
        username: 'Bot',
        isBot: true
      }
    });

    await prisma.spaceRole.create({
      data: {
        spaceId,
        userId: botUser.id,
        role: 'admin',
        isAdmin: true
      }
    });
  }

  return botUser;
}

/**
 * @returns Space linked to API key in the request
 * Throws if the API key or space do not exist
 */
export async function getSpaceFromApiKey (req: NextApiRequest): Promise<Space> {
  const apiKey = req.headers?.authorization?.split('Bearer').join('').trim() ?? req.query.api_key as string;

  // Protect against api keys or nullish API Keys
  if (!apiKey || apiKey.length < 1) {
    throw new Error('Api key not found');
  }

  const spaceToken = await prisma.spaceApiToken.findFirst({
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
 *
 * assigns authorizedSpaceId so follow-on endpoints can use it
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

    req.authorizedSpaceId = space.id;

    const botUser = await getBotUser(space.id);

    req.botUser = botUser;

  }
  catch (error) {
    console.log('Found error', error);
    return res.status(401).send({ error: 'Please provide a valid API token' });
  }

  next();

}

export default requireApiKey;
