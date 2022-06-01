import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { User, UserDetails } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';
import { ExtendedPoap } from 'models';
import { getPOAPs } from 'lib/poap';

export type PublicUser = Pick<User, 'id' | 'username' | 'avatar' | 'path'> & {
  profile: UserDetails | null;
  visiblePoaps: Array<Partial<ExtendedPoap>>;
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
      profile: true,
      poaps: true
    }
  });

  // prefer match by user id
  const userById = users.find(user => user.id === userPath);

  if (userById) {
    res.status(200).json(userById);
  }
  else if (users.length > 0) {
    const user = users[0];
    const allPoaps = await getPOAPs(user.addresses);

    // eslint-disable-next-line max-len
    const visiblePoaps = allPoaps.filter(poap => user.poaps.find(p => p.isHidden && p.tokenId === poap.tokenId && p.walletAddress === poap.walletAddress));

    res.status(200).json({
      ...user,
      visiblePoaps
    });
  }
  else {
    throw new DataNotFoundError('User not found');
  }
}

export default withSessionRoute(handler);
