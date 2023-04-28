import { prisma } from '@charmverse/core';

import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { getNFT } from 'lib/blockchain/nfts';
import * as alchemyApi from 'lib/blockchain/provider/alchemy';
import log from 'lib/log';
import { sessionUserRelations } from 'lib/session/config';
import type { UserAvatar } from 'lib/users/interfaces';
import { InvalidInputError } from 'lib/utilities/errors';
import { getFilenameWithExtension } from 'lib/utilities/getFilenameWithExtension';
import type { LoggedInUser } from 'models';

export async function updateProfileAvatar({
  avatar,
  avatarTokenId,
  avatarContract,
  avatarChain,
  userId
}: UserAvatar & { userId: string }): Promise<LoggedInUser> {
  let avatarUrl = avatar || null;
  const updatedTokenId = (avatar && avatarTokenId) || null;
  const updatedContract = (avatar && avatarContract) || null;

  if (!!updatedContract !== !!updatedTokenId) {
    throw new InvalidInputError('Invalid avatar data');
  }

  const isNftAvatar = avatar && updatedTokenId && updatedContract && avatarChain;

  // Provided NFT data
  if (isNftAvatar) {
    const wallets = await prisma.userWallet.findMany({
      where: {
        userId
      }
    });
    const owners = await alchemyApi.getOwners(updatedContract, updatedTokenId, avatarChain);
    const isOwner = wallets.some((a) => {
      return owners.find((o) => o.toLowerCase() === a.address.toLowerCase());
    });

    if (!isOwner) {
      throw new InvalidInputError('You do not own the selected NFT');
    }

    const nft = await getNFT({
      contractAddress: updatedContract,
      tokenId: updatedTokenId,
      chainId: avatarChain,
      userId
    });

    if (nft.image) {
      const pathInS3 = getUserS3FilePath({ userId, url: getFilenameWithExtension(nft.image) });
      try {
        const { url } = await uploadUrlToS3({ pathInS3, url: nft.image });
        avatarUrl = url;
      } catch (e) {
        log.error('Failed to save avatar', { error: e, pathInS3, url: nft.image, userId });
        throw new InvalidInputError('Failed to save avatar');
      }
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

  return user;
}
