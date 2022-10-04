import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { getNFT } from 'lib/blockchain/nfts';
import * as alchemyApi from 'lib/blockchain/provider/alchemy';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { getUserProfile } from 'lib/users/getUser';
import type { UserAvatar } from 'lib/users/interfaces';
import { InvalidInputError } from 'lib/utilities/errors';
import { getFilenameWithExtension } from 'lib/utilities/getFilenameWithExtension';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(updateAvatar);

async function updateAvatar (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: string }>) {
  const { avatar, avatarTokenId, avatarContract, avatarChain } = req.body as UserAvatar;
  const { id: userId } = req.session.user;

  let avatarUrl = avatar || null;
  const updatedTokenId = (avatar && avatarTokenId) || null;
  const updatedContract = (avatar && avatarContract) || null;

  if (!!updatedContract !== !!updatedTokenId) {
    throw new InvalidInputError('Invalid avatar data');
  }

  const isNftAvatar = avatar && updatedTokenId && updatedContract && avatarChain;

  // Provided NFT data
  if (isNftAvatar) {
    const user = await getUserProfile('id', req.session.user.id);
    const owners = await alchemyApi.getOwners(updatedContract, updatedTokenId, avatarChain);

    const isOwner = user?.wallets.some(a => {
      return owners.find(o => o.toLowerCase() === a.address.toLowerCase());
    });

    if (!isOwner) {
      throw new InvalidInputError('You do not own selected NFT');
    }

    const nft = await getNFT(updatedContract, updatedTokenId, avatarChain);

    if (nft.image) {
      const pathInS3 = getUserS3FilePath({ userId, url: getFilenameWithExtension(nft.image) });
      const { url } = await uploadUrlToS3({ pathInS3, url: nft.image });
      avatarUrl = url;
    }

  }

  const user = await prisma.user.update({
    where: {
      id: userId
    },
    include: sessionUserRelations,
    data: {
      avatar: avatarUrl,
      avatarContract: updatedContract || null,
      avatarTokenId: updatedTokenId || null,
      avatarChain: isNftAvatar ? avatarChain : null
    }
  });

  res.status(200).json(user);
}

export default withSessionRoute(handler);
