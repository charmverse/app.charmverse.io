import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadUrlToS3 } from '@root/lib/aws/uploadToS3Server';
import { getNFT, verifyNFTOwner } from '@root/lib/blockchain/getNFTs';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { sessionUserRelations } from '@root/lib/session/config';
import type { UserAvatar } from '@root/lib/users/interfaces';
import { InvalidInputError } from '@root/lib/utils/errors';
import { getFilenameWithExtension } from '@root/lib/utils/getFilenameWithExtension';

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
    const isOwner = await verifyNFTOwner({
      address: updatedContract,
      chainId: avatarChain,
      tokenId: updatedTokenId,
      userAddresses: wallets.map((w) => w.address)
    });

    if (!isOwner) {
      throw new InvalidInputError('You do not own the selected NFT');
    }

    const nft = await getNFT({
      address: updatedContract,
      tokenId: updatedTokenId,
      chainId: avatarChain
    });

    if (nft?.image) {
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
