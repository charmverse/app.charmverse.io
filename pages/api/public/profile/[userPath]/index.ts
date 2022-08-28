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
import { NftData } from 'lib/nft/types';
import { getNFTs } from 'lib/nft/getNfts';

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

  if (userById) {
    const allPoaps = await getPOAPs(userById.addresses);
    const allNfts = await getNFTs(userById.addresses);

    const visiblePoaps = allPoaps
      .filter(poap => !userById.profileItems
        .find(profileItem => profileItem.isHidden && profileItem.id === poap.tokenId && profileItem.walletAddress === poap.walletAddress));
    const visibleNfts = allNfts
      .filter(nft => !userById.profileItems
        .find(profileItem => profileItem.isHidden && profileItem.id === nft.tokenId));

    res.status(200).json({
      ...userById,
      visiblePoaps,
      visibleNfts
    });
  }
  else {
    throw new DataNotFoundError('User not found');
  }
}

export default withSessionRoute(handler);
