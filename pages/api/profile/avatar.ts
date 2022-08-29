import * as alchemyApi from 'lib/blockchain/provider/alchemy';
import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getUserS3Folder, uploadToS3 } from 'lib/aws/uploadToS3Server';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';

import { LoggedInUser } from 'models';
import { mapNftFromAlchemy } from 'lib/nft/utilities/mapNftFromAlchemy';
import { getUserProfile } from 'lib/users/getUser';
import { getFilenameWithExtension } from 'lib/utilities/getFilenameWithExtension';
import { UserAvatar } from 'lib/users/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(updateAvatar);

async function updateAvatar (req: NextApiRequest, res: NextApiResponse<LoggedInUser | {error: string}>) {
  const { avatar, avatarTokenId, avatarContract } = req.body as UserAvatar;
  const { id: userId } = req.session.user;

  let avatarUrl = avatar || null;
  const updatedTokenId = (avatar && avatarTokenId) || null;
  const updatedContract = (avatar && avatarContract) || null;

  if (!!updatedContract !== !!updatedTokenId) {
    throw new InvalidInputError('Invalid avatar data');
  }

  const chainId = 1;
  const isNftAvatar = avatar && updatedTokenId && updatedContract;

  // Provided NFT data
  if (isNftAvatar) {
    const user = await getUserProfile('id', req.session.user.id);
    const owners = await alchemyApi.getOwners(updatedContract, updatedTokenId, chainId);

    const isOwner = user?.addresses.some(a => {
      return owners.find(o => o.toLowerCase() === a.toLowerCase());
    });

    if (!isOwner) {
      throw new InvalidInputError('You do not own selected NFT');
    }

    const nft = await alchemyApi.getNft(updatedContract, updatedTokenId, chainId);
    const mappedNft = mapNftFromAlchemy(nft, chainId);

    if (mappedNft.image) {
      const fileName = getUserS3Folder({ userId, url: getFilenameWithExtension(mappedNft.image) });
      const { url } = await uploadToS3({ fileName, url: mappedNft.image });
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
      avatarChain: isNftAvatar ? chainId : null
    }
  });

  res.status(200).json(user);
}

export default withSessionRoute(handler);
