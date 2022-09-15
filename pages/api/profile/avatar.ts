import * as alchemyApi from 'lib/blockchain/provider/alchemy';
import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getUserS3Folder, uploadToS3 } from 'lib/aws/uploadToS3Server';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';

import { LoggedInUser } from 'models';
import { getNFT } from 'lib/blockchain/nfts';
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
  const { avatar, avatarTokenId, avatarContract, avatarChain } = req.body as UserAvatar;
  const { id: userId } = req.session.user;

  if (!avatar || !avatarContract || !avatarTokenId || !avatarChain) {
    throw new InvalidInputError('Invalid avatar data');
  }

  let avatarUrl = avatar || '';
  const isNftAvatar = avatarContract && avatarTokenId && avatarChain;

  // Provided NFT data
  if (isNftAvatar) {
    const user = await getUserProfile('id', req.session.user.id);
    const owners = await alchemyApi.getOwners(avatarContract, avatarTokenId, avatarChain);

    const isOwner = user?.addresses.some(a => {
      return owners.find(o => o.toLowerCase() === a.toLowerCase());
    });

    if (!isOwner) {
      throw new InvalidInputError('You do not own selected NFT');
    }

    const nft = await getNFT(avatarContract, avatarTokenId, avatarChain);

    if (nft.image) {
      avatarUrl = nft.image;
    }
  }

  const fileName = getUserS3Folder({ userId, url: getFilenameWithExtension(avatarUrl) });
  const { url: uploadedAvatar } = await uploadToS3({ fileName, url: avatarUrl });

  const user = await prisma.user.update({
    where: {
      id: userId
    },
    include: sessionUserRelations,
    data: {
      avatar: uploadedAvatar,
      avatarContract: avatarContract || null,
      avatarTokenId: avatarTokenId || null,
      avatarChain: avatarChain || null
    }
  });

  res.status(200).json(user);
}

export default withSessionRoute(handler);
