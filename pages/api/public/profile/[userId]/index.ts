import type { User, UserDetails } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { NftData, ExtendedPoap } from 'lib/blockchain/interfaces';
import { getNFTs } from 'lib/blockchain/nfts';
import { getPOAPs } from 'lib/blockchain/poaps';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

export type PublicUser = Pick<User, 'id' | 'username' | 'avatar' | 'path'> & {
  profile: UserDetails | null;
  visiblePoaps: Partial<ExtendedPoap>[];
  visibleNfts: NftData[];
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getUserProfile);

async function getUserProfile (req: NextApiRequest, res: NextApiResponse<PublicUser>) {

  const { userId } = req.query;

  if (typeof userId !== 'string') {
    throw new InvalidInputError('Please provide a valid user path');
  }

  // support lookup by user id or path
  const condition = isUUID(userId)
    ? {
      OR: [
        { id: userId },
        { path: userId }
      ]
    }
    : { path: userId };

  const users = await prisma.user.findMany({
    where: condition,
    include: {
      profile: true,
      profileItems: true,
      wallets: true
    }
  });

  // prefer match by user id
  const userById = users.find(user => user.id === userId) ?? users[0];

  if (!userById) {
    throw new DataNotFoundError('User not found');
  }

  function isVisible (item: { id: string }): boolean {
    return !userById.profileItems.some(profileItem => profileItem.isHidden && profileItem.id === item.id);
  }

  const allPoaps = await getPOAPs(userById.wallets.map(w => w.address));
  const allNfts = await getNFTs(userById.wallets.map(w => w.address));

  const visiblePoaps = allPoaps.filter(isVisible);
  const visibleNfts = allNfts.filter(isVisible);

  delete (userById as any).profileItems;
  delete (userById as any).wallets;

  res.status(200).json({
    ...userById,
    visiblePoaps,
    visibleNfts
  });
}

export default withSessionRoute(handler);
