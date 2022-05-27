import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { User, UserDetails } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

export type PublicUser = Pick<User, 'id' | 'username' | 'avatar'> & {
  profile: UserDetails | null;
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getUserProfile);

async function getUserProfile (req: NextApiRequest, res: NextApiResponse<PublicUser>) {

  const { userPath } = req.query;

  if (typeof userPath !== 'string') {
    throw new InvalidInputError('Please provide a valid user path');
  }

  // support lookup by user id or path
  const condition = isUUID(userPath)
    ? {
      OR: [
        { id: userPath },
        { path: userPath }
      ]
    }
    : { path: userPath };

  const users = await prisma.user.findMany({
    where: condition,
    include: {
      profile: true
    }
  });

  // prefer match by user id
  const userById = users.find(user => user.id === userPath);

  if (userById) {
    res.status(200).json(userById);
  }
  else if (users.length > 0) {
    res.status(200).json(users[0]);
  }
  else {
    throw new DataNotFoundError('User not found');
  }
}

export default withSessionRoute(handler);
