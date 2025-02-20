import type { User, UserDetails } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { isUUID } from '@packages/utils/strings';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, InvalidInputError } from 'lib/utils/errors';

export type PublicUser = Pick<User, 'id' | 'username' | 'avatar' | 'path'> & {
  profile: UserDetails | null;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getUserProfile);

async function getUserProfile(req: NextApiRequest, res: NextApiResponse<PublicUser>) {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    throw new InvalidInputError('Please provide a valid user path');
  }

  // support lookup by user id or path
  const condition = isUUID(userId)
    ? {
        OR: [{ id: userId }, { path: userId }]
      }
    : { path: userId };

  const users = await prisma.user.findMany({
    where: condition,
    include: {
      profile: true
    }
  });

  // prefer match by user id
  const userById = users.find((user) => user.id === userId) ?? users[0];

  if (!userById) {
    throw new DataNotFoundError('User not found');
  }

  res.status(200).json(userById);
}

export default withSessionRoute(handler);
