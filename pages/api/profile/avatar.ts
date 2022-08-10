import { alchemyApi } from 'lib/blockchain/provider/alchemy';
import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getUserS3Folder, uploadToS3 } from 'lib/aws/uploadToS3Server';
import { onError, onNoMatch } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { SetAvatarRequest } from 'lib/users/interfaces';
import { LoggedInUser } from 'models';
import { mapNftFromAlchemy } from 'lib/nft/utilities/mapNftFromAlchemy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .post(updateAvatar);

async function updateAvatar (req: NextApiRequest, res: NextApiResponse<LoggedInUser | {error: string}>) {
  const { url, tokenId, contractAddress } = req.body as SetAvatarRequest;
  const { id: userId } = req.session.user;

  if (!url || !contractAddress || !tokenId) {
    res.status(400).json({ error: 'Invalid avatar data' });
  }

  let avatarUrl = url;
  const chainId = 1;
  const isNftAvatar = contractAddress && tokenId;

  // Provided NFT data
  if (isNftAvatar) {
    const user = await prisma.user.findUnique({
      where: {
        id: req.session.user.id
      },
      include: sessionUserRelations
    });

    const owners = await alchemyApi.getOwners(contractAddress, tokenId, chainId);
    const isOwner = user?.addresses.some(a => owners.includes(a));

    if (!isOwner) {
      res.status(400).json({ error: 'You do not own selected NFT' });
      return;
    }

    const nft = await alchemyApi.getNft(contractAddress, tokenId, chainId);
    const mappedNft = mapNftFromAlchemy(nft, chainId);

    if (mappedNft.image) {
      avatarUrl = mappedNft.image;
    }
  }

  const { url: avatar } = await uploadToS3({ fileName: getUserS3Folder({ userId, url: avatarUrl }), url: avatarUrl });

  const user = await prisma.user.update({
    where: {
      id: userId
    },
    include: sessionUserRelations,
    data: {
      avatar,
      avatarContract: contractAddress || null,
      avatarTokenId: tokenId || null,
      avatarTokenChain: isNftAvatar ? chainId : null
    }
  });

  res.status(200).json(user);
}
