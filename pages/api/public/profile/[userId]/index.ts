import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { User, UserDetails } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';
import { getPOAPs } from 'lib/blockchain/poaps';
import { NftData, ExtendedPoap } from 'lib/blockchain/interfaces';
import { getNFTs } from 'lib/blockchain/nfts';

export type PublicUser = Pick<User, 'id' | 'username' | 'avatar' | 'path'> & {
  profile: UserDetails | null;
  visiblePoaps: Partial<ExtendedPoap>[];
  visibleNfts: NftData[]
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
      profileItems: true
    }
  });

  // prefer match by user id
  const userById = users.find(user => user.id === userPath) ?? users[0];

  if (!userById) {
    throw new DataNotFoundError('User not found');
  }

  function isVisible (item: { id: string }): boolean {
    return !userById.profileItems.some(profileItem => profileItem.isHidden && profileItem.id === item.id);
  }

  const allPoaps = await getPOAPs(userById.addresses);
  const allNfts = await getNFTs(userById.addresses);

  const visiblePoaps = allPoaps.filter(isVisible);
  const visibleNfts = allNfts.filter(isVisible);

  delete (userById as any).profileItems;

  res.status(200).json({
    ...userById,
    visiblePoaps,
    visibleNfts
  });
}

export default withSessionRoute(handler);
